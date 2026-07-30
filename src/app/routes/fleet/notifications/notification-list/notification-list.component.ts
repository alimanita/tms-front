import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, NotificationFlotteResponse } from '../../fleet.service';


@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
})
export class NotificationListComponent implements OnInit {
  notifications: NotificationFlotteResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.fleetService.getNotificationsNonLues().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement notifications', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  marquerLue(n: NotificationFlotteResponse): void {
    this.fleetService.marquerLue(n.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  marquerToutesLues(): void {
    this.fleetService.marquerToutesLues().subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  ignorer(n: NotificationFlotteResponse): void {
    this.fleetService.ignorerNotification(n.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  severityClass(severity?: string): string {
    return ({
      INFO: 'notif--info',
      WARNING: 'notif--warning',
      CRITICAL: 'notif--critical',
    } as any)[severity ?? ''] ?? 'notif--info';
  }

  severityIcon(severity?: string): string {
    return ({
      INFO: 'ℹ️',
      WARNING: '⚠️',
      CRITICAL: '🔴',
    } as any)[severity ?? ''] ?? 'ℹ️';
  }
}