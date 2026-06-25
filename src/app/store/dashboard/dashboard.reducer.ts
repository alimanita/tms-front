import { createFeature, createReducer, on } from '@ngrx/store';
import { DashboardData } from '../../core/models/domain.model';
import { DashboardActions } from './dashboard.actions';

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null
};

export const dashboardFeature = createFeature({
  name: 'dashboard',
  reducer: createReducer(
    initialState,
    on(DashboardActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(DashboardActions.loadSuccess, (state, { data }) => ({
      ...state,
      loading: false,
      data
    })),
    on(DashboardActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    }))
  )
});

export const {
  name: dashboardFeatureKey,
  reducer: dashboardReducer,
  selectDashboardState,
  selectData,
  selectLoading,
  selectError
} = dashboardFeature;
