/**
 * Field specs for the write-back drawer · Phase 3b.04.
 *
 * Lives in src/lib/ so both the drawer component and the section mode
 * components can import the spec without a circular dependency.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */

export type FieldType = 'text' | 'boolean' | 'date' | 'enum';

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  enumValues?: readonly string[];
  readOnly: boolean;
};

export type UpdateTarget =
  | 'task-update'
  | 'milestone-update'
  | 'od-update'
  | 'kpi-update'
  | 'surface-update';

export const TASK_SPEC: readonly FieldSpec[] = [
  { name: 'id', label: 'ID', type: 'text', readOnly: true },
  { name: 'phase', label: 'Phase', type: 'text', readOnly: true },
  { name: 'day', label: 'Day', type: 'text', readOnly: true },
  { name: 'cat', label: 'Category', type: 'enum', enumValues: ['OPERATOR', 'COWORK', 'CLAUDE'], readOnly: false },
  { name: 'title', label: 'Title', type: 'text', readOnly: false },
  { name: 'done', label: 'Done', type: 'boolean', readOnly: false },
  { name: 'completedAt', label: 'Completed at', type: 'date', readOnly: false },
  { name: 'blockedBy', label: 'Blocked by', type: 'text', readOnly: false },
];

export const MILESTONE_SPEC: readonly FieldSpec[] = [
  { name: 'id', label: 'ID', type: 'text', readOnly: true },
  { name: 'phase', label: 'Phase', type: 'text', readOnly: true },
  { name: 'day', label: 'Day', type: 'text', readOnly: true },
  { name: 'title', label: 'Title', type: 'text', readOnly: false },
  { name: 'criterion', label: 'Criterion', type: 'text', readOnly: false },
  { name: 'status', label: 'Status', type: 'enum', enumValues: ['OPEN', 'IN-PROGRESS', 'CLOSED'], readOnly: false },
];

export const OD_SPEC: readonly FieldSpec[] = [
  { name: 'id', label: 'ID', type: 'text', readOnly: true },
  { name: 'item', label: 'Item', type: 'text', readOnly: false },
  { name: 'need', label: 'Need', type: 'text', readOnly: false },
  { name: 'blocking', label: 'Blocking', type: 'text', readOnly: false },
  { name: 'rec', label: 'Recommendation', type: 'text', readOnly: false },
  { name: 'status', label: 'Status', type: 'enum', enumValues: ['OPEN', 'DECIDED', 'DEFERRED'], readOnly: false },
  { name: 'priority', label: 'Priority', type: 'enum', enumValues: ['PRIO-1', 'PRIO-2', 'PRIO-3'], readOnly: false },
];

export const KPI_SPEC: readonly FieldSpec[] = [
  { name: 'id', label: 'ID', type: 'text', readOnly: true },
  { name: 'name', label: 'Name', type: 'text', readOnly: true },
  { name: 'source', label: 'Source', type: 'text', readOnly: true },
  { name: 'target', label: 'Target', type: 'text', readOnly: true },
  { name: 'value', label: 'Value', type: 'text', readOnly: false },
  { name: 'state', label: 'State', type: 'enum', enumValues: ['achieved', 'on_track', 'at_risk', 'off_track'], readOnly: false },
];

export const SURFACE_SPEC: readonly FieldSpec[] = [
  { name: 'name', label: 'Name', type: 'text', readOnly: true },
  { name: 'url', label: 'URL', type: 'text', readOnly: true },
  { name: 'host', label: 'Host', type: 'text', readOnly: true },
  { name: 'announce', label: 'Announce', type: 'text', readOnly: false },
  { name: 'residue', label: 'Residue', type: 'text', readOnly: false },
  { name: 'action', label: 'Action', type: 'text', readOnly: false },
];

export const SPEC_BY_TARGET: Record<UpdateTarget, readonly FieldSpec[]> = {
  'task-update': TASK_SPEC,
  'milestone-update': MILESTONE_SPEC,
  'od-update': OD_SPEC,
  'kpi-update': KPI_SPEC,
  'surface-update': SURFACE_SPEC,
};
