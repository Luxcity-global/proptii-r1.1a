import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NativePropertiesController } from '../controllers/native-properties.controller';
import { NativePropertiesService } from '../services/native-properties.service';
import { NativeProperty, NativePropertySchema } from '../schemas/native-property.schema';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: NativeProperty.name, schema: NativePropertySchema }
    ]),
  ],
  controllers: [NativePropertiesController],
  providers: [NativePropertiesService],
  exports: [NativePropertiesService],
})
export class NativePropertiesModule {}
