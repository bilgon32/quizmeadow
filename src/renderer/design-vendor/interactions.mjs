/** Whole-row pointer convenience; the native button remains the sole keyboard path. */
export function bindSelectableRows(table,{actionSelector='.bgp-row-action'}={}) {
 const click=event=>{
  const row=event.target.closest('tr[data-selectable]');
  if(!row||!table.contains(row)||event.target.closest('button,a,input,select,textarea,summary,[contenteditable],[role="button"]')||String(table.ownerDocument.getSelection?.()??''))return;
  row.querySelector(actionSelector)?.click();
 };
 table.addEventListener('click',click);
 return ()=>table.removeEventListener('click',click);
}
