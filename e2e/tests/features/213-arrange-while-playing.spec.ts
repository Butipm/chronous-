import { expect, test } from '../fixtures/override';

test('Rearrange while playing', async ({ page }) => {
  await page.goto('/rundown');
  await page.getByRole('button', { name: 'Edit' }).click();

  // clear rundown
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Add event' }).click();
  await page.getByRole('button', { name: 'Add event' }).click();

  // entries are identified by title after the move; the cue number is not text
  for (const [index, title] of ['one', 'two', 'three'].entries()) {
    const titleInput = page.getByTestId(`entry-${index + 1}`).getByTestId('entry__title');
    await titleInput.click();
    await titleInput.fill(title);
    await titleInput.press('Enter');
  }

  // start event 2
  await page.getByTestId('entry-2').getByRole('button', { name: 'Start event' }).click();
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toHaveAttribute('data-running');

  // move event 2 up
  const secondRow = page.getByTestId('entry-2').getByTestId('rundown-event');
  await secondRow.click({ position: { x: 4, y: 4 } });
  await secondRow.press('Alt+ControlOrMeta+ArrowUp');

  // the moved event is now first, and it is still the one playing
  await expect(page.getByTestId('entry-1').getByTestId('entry__title')).toHaveValue('two');
  await expect(page.getByTestId('entry-1').getByTestId('rundown-event')).toHaveAttribute('data-running');
  // and the event it displaced is now second
  await expect(page.getByTestId('entry-2').getByTestId('entry__title')).toHaveValue('one');
});

test('flag and unflag an event while playing', async ({ page }) => {
  await page.goto('/editor/');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Add event' }).click();

  //start the the first event
  await page.getByTestId('entry-1').getByRole('button', { name: 'Start event' }).click();

  // there should be no flag times
  await expect(page.getByTestId('flag-plannedStart')).toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).toContainText('––:––:––');

  // set the flag - right-click the row, not a text node inside it
  const secondRow = page.getByTestId('entry-2').getByTestId('rundown-event');
  await secondRow.click({ button: 'right', position: { x: 200, y: 20 } });
  await page.getByRole('menuitem', { name: 'Add flag' }).click();

  // now there should be flag times
  await expect(page.getByTestId('flag-plannedStart')).not.toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).not.toContainText('––:––:––');

  // remove the flag again
  await secondRow.click({ button: 'right', position: { x: 200, y: 20 } });
  await page.getByRole('menuitem', { name: 'Remove flag' }).click();

  // there should be no flag times
  await expect(page.getByTestId('flag-plannedStart')).toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).toContainText('––:––:––');
});
