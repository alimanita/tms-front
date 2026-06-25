import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { DashboardData } from '../../core/models/domain.model';
import { TmsApiService } from '../../core/services/tms-api.service';
import { DashboardActions } from './dashboard.actions';

@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(TmsApiService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.load),
      switchMap(() =>
        this.api.getDashboard().pipe(
          map((data) => DashboardActions.loadSuccess({ data: data as DashboardData })),
          catchError(() => of(DashboardActions.loadFailure({ error: 'Impossible de charger le dashboard' })))
        )
      )
    )
  );
}
