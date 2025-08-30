import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeEnhancerService } from './services/recipe-enhancer.service';
import { AiModule } from '../ai/ai.module';
import { createMulterOptions } from '../../common/config/multer.config';

@Module({
  imports: [
    AiModule,
    MulterModule.registerAsync({
      useFactory: createMulterOptions,
    }),
  ],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeEnhancerService],
  exports: [RecipesService, RecipeEnhancerService],
})
export class RecipesModule {}