# Tài Liệu Hướng Dẫn - Module Schedules

> [!NOTE]
> Module **Schedules** đóng vai trò là "cầu nối" trung tâm giữa hệ thống quản lý học tập (Backend NestJS) và công cụ xếp lịch thông minh (AI Engine Python). 

Module này chịu trách nhiệm chuẩn bị dữ liệu, điều phối quá trình sinh lịch, phát hiện xung đột và lưu trữ cấu trúc lịch học do sinh viên chọn. Tất cả các luồng hoạt động đều tự động lấy **học kỳ hiện tại (active semester)** để đảm bảo đồng bộ dữ liệu.

---

## 1. Luồng Hoạt Động (Workflows) & Mã Nguồn Tương Ứng

### 1.1. Luồng Validate & Chuẩn bị dữ liệu (Helper)
Đây là "trái tim" của việc validate dữ liệu. Hàm `getClassesByStudentId` sẽ gộp chung việc xác thực sinh viên, tự động tìm học kỳ đang hoạt động, và đảm bảo các môn học đã đăng ký có mở lớp.

```typescript
  async getClassesByStudentId(student_id: string) {
    // 1. Validate sinh viên
    await this.getStudentById(student_id);

    // 2. Tự động lấy học kỳ đang mở
    const activeSemester = await this.getSemeter();
    const semester_id = activeSemester.semester_id;

    // 3. Lấy thông tin đăng ký môn học (enrollments)
    const enrollments = await this.EnrollmentRepository.find({
      where: { student_id: student_id, semester_id: semester_id },
      relations: ['course'],
    });

    if (!enrollments || enrollments.length === 0) {
      throw new NotFoundException({ ... });
    }

    // 4. Lấy danh sách lớp (classes) cho các môn học đó
    const courses = enrollments.map((enrollment) => enrollment.course);
    const courseIds = courses.map((course) => course.course_id);
    const classes = await this.ClassRepository.find({
      where: { course_id: In(courseIds), semester_id: semester_id },
    });

    // 5. Kiểm tra ngoại lệ nếu có môn nào đó không mở lớp
    const missingCourse = courses.find(
      (c) => !classes.some((cls) => cls.course_id === c.course_id)
    );
    if (missingCourse) {
      throw new BadRequestException({ ... });
    }

    // Trả về bộ dữ liệu an toàn kèm semester_id
    return { courses, classes, semester_id }; 
  }
```

### 1.2. Luồng Kiểm Tra Xung Đột (Detect Conflict)
Hàm `detectConflict` tái sử dụng hàm helper ở trên để lấy ra các `classes` và `semester_id` hợp lệ, đóng gói gửi sang Python Engine thông qua `engineService` để phát hiện giờ trùng.

```typescript
  async detectConflict(student_id: string, dto: GenerateScheduleDto) {
    // Tái sử dụng để có được dữ liệu sạch (DRY code)
    const { classes, semester_id } = await this.getClassesByStudentId(student_id);

    // Build payload cho AI Engine
    const body = {
      student_id: student_id,
      semester_id: semester_id,
      classes: classes,
    };

    // Gọi Engine phát hiện xung đột và return cho người dùng
    return await this.engineService.detectConflicts(body);
  }
```

### 1.3. Luồng Sinh Thời Khóa Biểu (Generate Schedule)
Dữ liệu được chuẩn bị nạp cùng sở thích cá nhân để đưa cho Python Engine tính toán. Kết quả được lưu nháp (`is_draft: true`). Không cần DTO cung cấp `semester_id`.

```typescript
  async generateSchedule(student_id: string, dto: GenerateScheduleDto) {
    // 1. Lấy dữ liệu an toàn và semester_id tự động
    const { courses, classes, semester_id } = await this.getClassesByStudentId(student_id);

    // 2. Lấy Constraints (các ràng buộc) của sinh viên
    const preference = await this.getPreference(student_id);
    const personalEvents = await this.getPersonalEvent(student_id);

    // 3. Build Body gửi sang Python
    const body = {
      student_id: student_id,
      semester_id: semester_id,
      classes: classes,
      preferences: { ...preference },
      avoid_days: (preference.avoid_days ?? []).map((d) => d.day_of_week),
      personal_events: personalEvents,
      max_solutions: dto.max_solutions,
    };

    // 4. Giải thuật từ Python trả về
    const responseData = await this.engineService.generateSchedules(body);

    // 5. Mở Transaction xóa nháp cũ và lưu phương án mới
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(Schedule, { 
        student_id, semester_id: semester_id, is_draft: true 
      });
      
      // Vòng lặp: Tạo và lưu mới các Schedule & ScheduleClasses ...
      
      await queryRunner.commitTransaction();
    } catch (error) { 
      // ... rollback 
    }

    // 6. Ánh xạ trường course_name cho danh sách các class trả về
    // ...

    return responseData;
  }
```

### 1.4. Luồng Lưu Thời Khóa Biểu (Save Schedule)
Chốt 1 bản nháp thành lịch chính thức (`is_selected: true`). Tự động phát hiện học kỳ hiện tại thay vì dựa vào request của người dùng.

```typescript
  async saveSchedule(student_id: string, dto: SaveScheduleDto) {
    await this.getStudentById(student_id);
    
    // Tự động lấy học kỳ active
    const activeSemester = await this.getSemeter();
    const semester_id = activeSemester.semester_id;

    // Tìm lịch bản nháp vừa sinh mà sinh viên vừa chọn
    const schedule = await this.ScheduleRepository.findOne({
      where: {
        schedule_id: dto.schedule_id, 
        student_id: student_id, 
        semester_id: semester_id, 
        is_draft: true,
      },
    });

    // Vô hiệu hóa lịch cũ đã chốt trước đó (nếu có)
    await this.ScheduleRepository.update(
      { student_id, semester_id: semester_id, is_selected: true, is_active: true },
      { is_selected: false, is_draft: true, is_active: false },
    );

    // Chốt lịch mới
    schedule.is_selected = true;
    schedule.is_draft = false;
    schedule.is_active = true;
    await this.ScheduleRepository.save(schedule);

    // Fetch Full Relations để trả về lịch kèm details
    return await this.findSelectedBySemester(student_id);
  }
```

---

## 2. Kết Luận
Module `Schedules` hoàn toàn tuân thủ **Single Responsibility Principle (SRP)** và **DRY (Don't Repeat Yourself)**. Đặc biệt, việc gỡ bỏ tham số `semester_id` ở tầng Controller/DTO và thiết kế tự động lấy học kỳ đang hoạt động giúp bảo vệ hệ thống tuyệt đối khỏi các lỗi bất đồng bộ dữ liệu. Backend NestJS hiện tại đóng vai trò là một Database Proxy vững chắc, còn sự thông minh (toán học) nằm hoàn toàn bên Python AI Engine.
