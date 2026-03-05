import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
