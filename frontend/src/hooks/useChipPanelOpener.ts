export function openCardPanel() {
  window.dispatchEvent(new Event("kanban:open-card-panel"));
}
