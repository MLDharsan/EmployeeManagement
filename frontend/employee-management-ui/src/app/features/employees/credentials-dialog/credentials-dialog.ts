import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../../../core/services/toast.service';

interface CredentialsData {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-credentials-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './credentials-dialog.html',
  styleUrls: ['./credentials-dialog.css']
})
export class CredentialsDialogComponent {
  hidePassword = true;

  constructor(
    private dialogRef: MatDialogRef<CredentialsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CredentialsData,
    private toastService: ToastService
  ) {}

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  copyToClipboard(text: string, label: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toastService.success(`${label} copied to clipboard!`);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        this.fallbackCopy(text, label);
      });
    } else {
      this.fallbackCopy(text, label);
    }
  }

  private fallbackCopy(text: string, label: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.toastService.success(`${label} copied to clipboard!`);
    } catch (err) {
      this.toastService.error('Failed to copy to clipboard.');
    }
    document.body.removeChild(textArea);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
