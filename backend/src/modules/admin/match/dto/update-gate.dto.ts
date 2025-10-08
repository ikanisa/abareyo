import { PartialType } from '@nestjs/mapped-types';

import { CreateGateDto } from './create-gate.dto.js';

export class UpdateGateDto extends PartialType(CreateGateDto) {}
