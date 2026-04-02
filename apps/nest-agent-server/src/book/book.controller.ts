import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from "@nestjs/common";
import { BookService } from "./book.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";

@Controller("book")
export class BookController {
  @Inject("BOOK_REPOSITORY")
  private readonly bookRepository: any;

  constructor(private readonly bookService: BookService) {}

  @Post()
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()
  findAll() {
    return this.bookService.findAll();
  }

  @Get("author")
  getAuthor() {
    return this.bookRepository.author;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bookService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(+id, updateBookDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.bookService.remove(+id);
  }
}
