import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DashboardData } from '../../core/models/domain.model';

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ data: DashboardData }>(),
    'Load Failure': props<{ error: string }>()
  }
});
