import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PageHeader } from 'app/shared/page-header/page-header';


@Component({
  selector: 'app-reports-index',
  imports: [RouterModule, MatIconModule, PageHeader],
  templateUrl: './reports-index.html',
  styleUrl: './reports-index.scss'
})
export class ReportsIndex {}