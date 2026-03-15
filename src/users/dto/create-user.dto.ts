import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum'; 
export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty()
    @IsEmail()
    email!: string

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password!: string

    @ApiProperty()
    @IsEnum(UserRole)
    role!: UserRole
}
