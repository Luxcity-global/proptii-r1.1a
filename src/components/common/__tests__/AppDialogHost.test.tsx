import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppDialogHost from '../AppDialogHost';
import { showAlert, showConfirm } from '../../../utils/appDialog';

describe('AppDialogHost', () => {
  it('renders a branded confirmation modal and resolves true/false on button click', async () => {
    render(<AppDialogHost />);

    const deletePromise = showConfirm({
      title: 'Delete Contract',
      message: 'Are you sure you want to delete this contract? This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete Contract')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this contract? This action cannot be undone.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(deletePromise).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

    const acceptPromise = showConfirm(
      'Are you sure you want to delete this contract? This action cannot be undone.'
    );
    expect(await screen.findByText('Delete Contract')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(acceptPromise).resolves.toBe(true);
  });

  it('renders a branded notice modal for showAlert and closes on Escape or OK', async () => {
    render(<AppDialogHost />);

    const alertPromise = showAlert('Contract signed.');
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Contract signed.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(alertPromise).resolves.toBeUndefined();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

    const escPromise = showAlert('Failed to delete contract. Please try again.');
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await expect(escPromise).resolves.toBeUndefined();
  });
});
