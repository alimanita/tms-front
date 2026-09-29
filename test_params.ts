import { HttpClient } from "@angular/common/http";
import { HttpParams } from "@angular/common/http";
// This is just a test to see what Angular produces.
const p = new HttpParams({ fromObject: { sort: ['datePassage,asc'] } });
console.log(p.toString());
