import { Module, Global } from '@nestjs/common';
import { DatabaseProvider, DRIZZLE } from './db.provider';

@Global()
@Module({
    providers: [DatabaseProvider],
    exports: [DRIZZLE],
})
export class DatabaseModule { }