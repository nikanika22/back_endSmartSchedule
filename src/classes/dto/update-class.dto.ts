import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';

export class UpdateClassDto extends PartialType(
    OmitType(CreateClassDto, ['class_id'] as const),
) {}
