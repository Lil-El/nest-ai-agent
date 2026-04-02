import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  controllers: [BookController],
  providers: [
    BookService,
    // 除了 @Injectable() BookService 之外，还可以使用useFactory来提供一个工厂函数，以创建一个自定义的提供者。
    {
      provide: 'BOOK_REPOSITORY',
      useValue: {
        author: "🍀 Yann."
      }
    },
  ],
})
export class BookModule {}
