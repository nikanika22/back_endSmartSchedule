import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ConfigModule } from '@nestjs/config';
import { PersonalEventsModule } from './personal-events/personal-events.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { SemestersModule } from './semesters/semesters.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PreferencesModule } from './preferences/preferences.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_URL ? undefined : process.env.DATABASE_HOST,
      port: process.env.DATABASE_URL ? undefined : Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_URL ? undefined : process.env.DATABASE_USER,
      password: process.env.DATABASE_URL ? undefined : process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_URL ? undefined : process.env.DATABASE_NAME,
      ssl:
        process.env.DATABASE_URL ||
        process.env.DATABASE_SSLMODE === 'require' ||
        process.env.DATABASE_HOST?.includes('neon.tech')
          ? { rejectUnauthorized: false }
          : false,
      ...(process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            ssl:
              process.env.DATABASE_SSLMODE === 'require' ||
              process.env.DATABASE_URL?.includes('neon.tech')
                ? { rejectUnauthorized: false }
                : false,
          }
        : {
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT ?? 5432),
            username: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl:
              process.env.DATABASE_SSLMODE === 'require' ||
              process.env.DATABASE_HOST?.includes('neon.tech')
                ? { rejectUnauthorized: false }
                : false,
          }),
      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    StudentsModule,
    PersonalEventsModule,
    CoursesModule,
    ClassesModule,
    SemestersModule,
    EnrollmentsModule,
    PreferencesModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
