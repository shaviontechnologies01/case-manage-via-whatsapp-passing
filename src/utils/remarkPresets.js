/**
 * Preset Remark Options matching the operational master list
 */
export const REMARK_PRESETS = [
  // Frequently Used / Status
  'done',
  'today',
  'cancel done',
  'call not received',
  'NOT CONTACTED',
  'not given appointment',
  'future appointment',
  'timing issue',
  'Switch off',
  'site not ready',
  
  // Payment / Charges
  'not ready to pay service charge',
  'not ready to pay SF charge',
  'not ready to pay delivery charge',
  'not ready to pay re installation charge',
  'not ready to given service charge',
  
  // GKK / Filter & Confirmation
  'not ready to replace GKK',
  'gkk indication confirmation pending',
  'only service required',
  'Replacement',
  
  // Complaints & Orders
  'no any complaint',
  'no any order',
  'no stock',
  'Refused to service',
  'cancel karavi do',
  'not given cancel ocde',
  'cancel(after 10 days)',
  
  // Technical / Hardware Issues
  'SF housing leakage',
  'Dispance switch problem',
  'circuit problem',
  'waib problem',
  'adapter problem, not received call',
  'device not delivered',
  'Pls transfer to ARM',
  'duplicate call',

  // Scheduled Dates
  'on-1/9',
  'on-2/9',
  'on-4/9',
  'on-16/8',
  'on-24/8',
  'on-26/8',
  'on-27/8',
  'on-13/7'
];

export const CATEGORIZED_REMARKS = {
  'Quick Status': [
    'done',
    'today',
    'cancel done',
    'call not received',
    'NOT CONTACTED',
    'not given appointment',
    'future appointment',
    'Switch off',
    'site not ready'
  ],
  'Charges & Fees': [
    'not ready to pay service charge',
    'not ready to pay SF charge',
    'not ready to pay delivery charge',
    'not ready to pay re installation charge',
    'not ready to given service charge'
  ],
  'GKK & Service': [
    'not ready to replace GKK',
    'gkk indication confirmation pending',
    'only service required',
    'Replacement',
    'no any complaint',
    'no any order',
    'no stock'
  ],
  'Cancellation & Issues': [
    'Refused to service',
    'cancel karavi do',
    'not given cancel ocde',
    'cancel(after 10 days)',
    'SF housing leakage',
    'Dispance switch problem',
    'circuit problem',
    'waib problem',
    'adapter problem, not received call',
    'device not delivered',
    'Pls transfer to ARM',
    'duplicate call'
  ]
};
