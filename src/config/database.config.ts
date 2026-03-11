import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

export const databaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],

    inject: [ConfigService],

    useFactory: async (ConfigService: ConfigService) => ({
        type: 'mysql',
        host: ConfigService.get('DB_HOST'),
        port: ConfigService.get<number>('DB_PORT'),
        username: ConfigService.get<string>('DB_USERNAME'),
        password: ConfigService.get<string>('DB_PASSWORD'),
        database: ConfigService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
    }),
};