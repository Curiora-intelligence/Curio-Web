import {createSegmentedControl} from '../curiora/liquid.js';

// Product adapter: shared visuals know neither workspace names nor conversation state.
export function initLiquidSelection(control, onSelect) {
  const component=createSegmentedControl(control, {onSelect:tab=>{
    const name=tab.id.replace(/-tab$/, '');
    control.dataset.workspace=name;
    onSelect(name);
  }});
  return name=>{
    control.dataset.workspace=name;
    component.select(control.querySelector(`#${name}-tab`));
  };
}
