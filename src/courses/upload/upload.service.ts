import { Injectable, BadRequestException  } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import * as Exceljs from 'exceljs'
import { Course } from '../entities/course.entity'
import { ClassEntity } from '../../classes/entities/class.entity'
import { Semester } from '../../semesters/entities/semester.entity'

@Injectable()
export class UploadService {
    constructor(
        @InjectRepository(Course)
        private readonly courseRepository : Repository<Course>,

        @InjectRepository(ClassEntity)
        private readonly classRepository : Repository<ClassEntity>,

        @InjectRepository(Semester)
        private readonly semesterRepository : Repository<Semester>
    ) {}

    private async getWorksheetFromBuffer(fileBuffer: Buffer, sheetName: string, sheetIndex: number): Promise<Exceljs.Worksheet> {
        const workbook = new Exceljs.Workbook();
        
        try {
            await workbook.xlsx.load(fileBuffer as any);
        } catch (error) {
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: 'File không hợp lệ'
                }
            });
        }

        const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[sheetIndex];

        if (!worksheet) {
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'SHEET_NOT_FOUND',
                    message: `Không tìm thấy ${sheetName}`
                }
            });
        }

        return worksheet;
    }

    private async getExistingCourseIds(courseIds: string[]) {
        const existingCourses = await this.courseRepository.find({
            where: { course_id: In(courseIds) }
        });
        return new Set(existingCourses.map(course => course.course_id));
    }

    private toIsoDate(value: Exceljs.CellValue | undefined): string | null {
        const formatDate = (date: Date): string | null =>
            Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);

        if (value instanceof Date) return formatDate(value);
        if (typeof value === 'number') {
            return formatDate(new Date(Date.UTC(1899, 11, 30) + value * 86_400_000));
        }
        if (typeof value !== 'string') return null;

        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
        if (!match) return null;

        const [year, month, day] = match.slice(1).map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }
        return formatDate(date);
    }

    async importCoursesFromExcel(fileBuffer: Buffer) {
        const worksheet = await this.getWorksheetFromBuffer(fileBuffer, 'Sheet1', 0);

        const courses: Course[] = [];
        const errors: string[] = [];

        // Lấy dữ liệu thô từ Excel lưu vào 1 mảng tạm
        const rowsData: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber == 1) return;

            const course_id = row.getCell(1).value?.toString().trim();
            const course_name = row.getCell(2).value?.toString().trim();
            const credit_number = row.getCell(3).value;
            const department = row.getCell(4).value?.toString().trim();
            const start_date = this.toIsoDate(row.getCell(5).value);
            const end_date = this.toIsoDate(row.getCell(6).value);

            rowsData.push({ course_id, course_name, credit_number, department, start_date, end_date, rowNumber });
        });

        if (rowsData.length === 0) {
            return {
                success: true,
                data: {
                    message: 'File không có dữ liệu',
                    count: 0
                }
            };
        }

        // lấy danh sách môn học đã tồn tại
        const existingCourseIds = await this.getExistingCourseIds(rowsData.map(r => r.course_id));

        // khởi tạo danh sách course_id đã duyệt
        const seenCourseIds = new Set<string>();

        // Dùng vòng lặp for...of để duyệt mảng tạm
        for (const data of rowsData) {
            const { course_id, course_name, credit_number, department, start_date, end_date, rowNumber } = data;
            const credits = Number(credit_number);

            if (!course_id || !course_name || !credit_number || !department || !start_date || !end_date){
                errors.push(`Hàng ${rowNumber} thiếu thông tin bắt buộc`)
                continue; 
            }

            if (isNaN(credits) || credits <= 0){
                errors.push(`Hàng ${rowNumber} số tín chỉ không hợp lệ`)
                continue;
            }

            if (end_date < start_date) {
                errors.push(`Hàng ${rowNumber} ngày kết thúc không được nhỏ hơn ngày bắt đầu`);
                continue;
            }

            if (seenCourseIds.has(course_id)) {
                errors.push(`Hàng ${rowNumber} bị trùng lặp khóa học (Mã: ${course_id}) trong chính file Excel`)
                continue;
            }
            seenCourseIds.add(course_id);

            if (existingCourseIds.has(course_id)) {
                errors.push(`Hàng ${rowNumber} đã tồn tại khóa học (Mã: ${course_id})`);
                continue;
            }

            const course = this.courseRepository.create({
                course_id,
                course_name,
                credits,
                department,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
            });
            courses.push(course);
        }

        if (errors.length > 0){
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'IMPORT_ERRORS',
                    message: 'Dữ liệu trong file Excel không hợp lệ.',
                    details: errors
                }
            });
        }

        if (courses.length > 0) {
            await this.courseRepository.save(courses, { chunk: 100 });
        }

        return {
            success: true,
            data: {
                message: 'Import khóa học thành công',
                count: courses.length,
            }
        };
    }

    async importClassesFromExcel(fileBuffer: Buffer) {
        const worksheet = await this.getWorksheetFromBuffer(fileBuffer, 'Sheet1', 1);

        const classes: ClassEntity[] = [];
        const errors: string[] = [];

        // Lấy dữ liệu thô từ Excel lưu vào 1 mảng tạm
        const rowsData: any[] = []; 
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber == 1) return;

            const class_id = row.getCell(1).value?.toString().trim();
            const course_id = row.getCell(2).value?.toString().trim();
            const semester_id = row.getCell(3).value?.toString().trim();
            const day = row.getCell(4).value;
            const start_time = row.getCell(5).value?.toString().trim();
            const end_time = row.getCell(6).value?.toString().trim();
            const room = row.getCell(7).value?.toString().trim();
            const teacher = row.getCell(8).value?.toString().trim();
            const num_students = row.getCell(9).value;

            rowsData.push({ class_id, course_id, semester_id, day, start_time, end_time, room, teacher, num_students, rowNumber });
        });

        if (rowsData.length === 0) {
            return {
                success: true,
                data: {
                    message: 'File không có dữ liệu',
                    count: 0
                }
            };
        }

        // lấy danh sách lớp học đã tồn tại
        const existingClasses = await this.classRepository.find({
            where: { class_id: In(rowsData.map(r => r.class_id)) }
        });
        const existingClassIdsSet = new Set(existingClasses.map(c => c.class_id));

        // lấy danh sách môn học đã tồn tại
        const existingCourseIds = await this.getExistingCourseIds(rowsData.map(r => r.course_id));

        // lấy danh sách học kỳ đã tồn tại
        const existingSemesters = await this.semesterRepository.find({
            where: { semester_id: In(rowsData.map(r => r.semester_id)) }
        });
        const existingSemesterIdsSet = new Set(existingSemesters.map(s => s.semester_id));

        const seenClassIdsInExcel = new Set<string>();

        // Dùng vòng lặp for...of để duyệt mảng tạm
        for (const data of rowsData) {
            const { class_id, course_id, semester_id, day, start_time, end_time, room, teacher, num_students, rowNumber } = data;
            const dayInt = Number(day);
            const numStudentsInt = Number(num_students);

            if (!class_id || !course_id || !semester_id || !day || !start_time || !end_time || !room || !teacher || !num_students){
                errors.push(`Hàng ${rowNumber} thiếu thông tin bắt buộc`)
                continue; 
            }

            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
            if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
                errors.push(`Hàng ${rowNumber} định dạng giờ không hợp lệ (VD: 07:30)`);
                continue;
            }

            if (isNaN(dayInt) || dayInt < 2 || dayInt > 8){
                errors.push(`Hàng ${rowNumber} ngày học không hợp lệ`)
                continue;
            }

            if (isNaN(numStudentsInt) || numStudentsInt <= 0){
                errors.push(`Hàng ${rowNumber} số lượng sinh viên không hợp lệ`)
                continue;
            }

            if (seenClassIdsInExcel.has(class_id)) {
                errors.push(`Hàng ${rowNumber} bị trùng lặp lớp học (Mã: ${class_id}) trong chính file Excel`);
                continue;
            }
            seenClassIdsInExcel.add(class_id);
            
            if (!existingCourseIds.has(course_id)){
                errors.push(`Hàng ${rowNumber} không tồn tại khóa học (Mã: ${course_id})`)
                continue;
            }

            if (!existingSemesterIdsSet.has(semester_id)) {
                errors.push(`Hàng ${rowNumber} không tồn tại học kỳ (Mã: ${semester_id})`);
                continue;
            }

            if (existingClassIdsSet.has(class_id)){
                errors.push(`Hàng ${rowNumber} đã tồn tại lớp học (Mã: ${class_id})`)
                continue;
            }

            const classEntity = this.classRepository.create({
                class_id,
                course_id,
                semester_id,
                day_of_week: dayInt,
                start_time,
                end_time,
                room,
                instructor: teacher,
                max_students: numStudentsInt,
            });
            classes.push(classEntity);
            
        }

        if (errors.length > 0){
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'IMPORT_ERRORS',
                    message: 'Dữ liệu trong file Excel không hợp lệ.',
                    details: errors
                }
            });
        }

        if (classes.length > 0) {
            await this.classRepository.save(classes, { chunk: 100 });
        }

        return {
            success: true,
            data: {
                message: 'Import lớp học thành công',
                count: classes.length
            }
        };
    }
}