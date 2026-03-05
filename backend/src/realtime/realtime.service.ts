import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { StreamEvent } from "../parking/parking.types";

@Injectable()
export class RealtimeService {
  private readonly subject = new Subject<StreamEvent>();

  emit(event: StreamEvent): void {
    this.subject.next(event);
  }

  events(): Observable<StreamEvent> {
    return this.subject.asObservable();
  }
}
