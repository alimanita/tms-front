import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss'
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly page = toSignal(
    this.route.data.pipe(
      map((data) => ({
        title: data['title'] as string,
        description: data['description'] as string
      }))
    ),
    { initialValue: { title: 'Module', description: '' } }
  );
}
