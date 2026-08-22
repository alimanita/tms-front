import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true
})
export class PaginatePipe implements PipeTransform {
  transform(array: any[], pageIndex: number, pageSize: number): any[] {
    if (!array || array.length === 0) return [];
    const start = pageIndex * pageSize;
    return array.slice(start, start + pageSize);
  }
}