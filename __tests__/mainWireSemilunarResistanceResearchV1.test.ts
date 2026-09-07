import {describe,expect,it} from 'vitest';
import {createMainWireFourValveContinuousAreaResearchInputV1,MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
  validateMainWireFourValveDiseaseResearchInputV1} from '@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1';
import {createMainWireSemilunarResistanceResearchV1 as create,
  resolveMainWireSemilunarResistanceResearchParametersV1 as resolve} from '@/engine/valves/MainWireSemilunarResistanceResearchV1';
import {stepMainWireQuasiSteadyOrificeValveScalarsV2 as step} from '@/engine/valves/MainWireQuasiSteadyOrificeValveV2';
import {selectValidationStampModeV1,validationStampModeV1} from '@/engine/validationStampModeV1';
import {buildNodes} from '@/engine/core/topology';
import {vascularPvLawFromNodeV1 as law} from '@/engine/core/circulationGraphKernelV1';
import {MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1 as selectedProfile} from '@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1';
import {createMainWireIntegratedModelRoundedEjectionFixtureV1} from '@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1';
const source=createMainWireFourValveContinuousAreaResearchInputV1(MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1);
describe('semilunar resistance causal ablation, not public prior fitting',()=>{
  it('is absent from the production rounded-ejection assembly',()=>{
    const {runtime}=createMainWireIntegratedModelRoundedEjectionFixtureV1();
    expect(runtime).not.toHaveProperty('semilunarResistanceResearch');
    expect(runtime.vascular).not.toHaveProperty('pulmonaryArterialComplianceResearchScale');
  });
  it('preserves canonical validation and leaves area/kinetics and inlet valves untouched',()=>{
    const p=create(source,{AoV:0,PV:1}),v=resolve(source,p);
    expect(v.MV).toBe(source.valves.MV);expect(v.TV).toBe(source.valves.TV);expect(v.PV).toBe(source.valves.PV);
    expect(v.AoV).toEqual({...source.valves.AoV,parameterSetId:expect.any(String),backgroundLinearResistanceMmHgSecPerMl:0});
    expect(validateMainWireFourValveDiseaseResearchInputV1(source)).toEqual([]);
    expect(validateMainWireFourValveDiseaseResearchInputV1({...source,valves:v}).length).toBeGreaterThan(0);
    expect(()=>create({...source,valves:{...source.valves,PV:{...source.valves.PV,openingTimeConstantSec:.1}}},{AoV:1,PV:0})).toThrow(/canonical valve source/);
  });
  it('unit profile is bit-identical at valve evaluation, with immutable input ownership',()=>{
    const scale={AoV:1,PV:1} as const,p=create(source,scale),v=resolve(source,p);
    for(const id of ['AoV','PV'] as const){expect(v[id]).toBe(source.valves[id]);
      expect(step(.4,.002,25,20,v[id])).toEqual(step(.4,.002,25,20,source.valves[id]));}
    expect(p.resistanceScaleByValve).not.toBe(scale);expect(Object.isFrozen(p.resistanceScaleByValve)).toBe(true);
  });
  it('does not reuse a compiled profile when validation stamps are disabled',()=>{
    const mode=validationStampModeV1();
    try{selectValidationStampModeV1('validation-stamps-enabled');
      const p=create(source,{AoV:0,PV:1}),a=resolve(source,p);expect(resolve(source,p)).toBe(a);
      selectValidationStampModeV1('validation-stamps-disabled');
      const b=resolve(source,p);expect(b).not.toBe(a);expect(b).toEqual(a);
      expect(resolve(source,p)).not.toBe(b);
    }finally{selectValidationStampModeV1(mode);}
  });
  it.each([null,{AoV:NaN,PV:1},{AoV:1,PV:.3},{AoV:-1,PV:1},{AoV:-0,PV:1},{AoV:0,PV:0,TV:0}])('rejects undeclared scales %j',scale=>{
    expect(()=>create(source,scale as never)).toThrow(/multipliers/);
  });
  it('rejects tampered hash, source affinity, and mutable post-resolution changes',()=>{
    const p=create(source,{AoV:0,PV:0});
    expect(()=>resolve(source,{...p,parameterIdentityHash:'00000000'})).toThrow(/identity/);
    const different=createMainWireFourValveContinuousAreaResearchInputV1({...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
      PV:{...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1.PV,maximumForwardEoaCm2:3}});
    expect(()=>resolve(different,p)).toThrow(/source/);
    const mutable={...p,resistanceScaleByValve:{...p.resistanceScaleByValve}};resolve(source,mutable);mutable.resistanceScaleByValve.PV=1;
    expect(()=>resolve(source,mutable)).toThrow(/identity/);
  });
  it.each(['AoV','PV'] as const)('keeps zero-R %s flow passive and exercises the zero-gradient convention',id=>{
    const p=resolve(source,create(source,{AoV:0,PV:0}))[id];
    for(const dp of [-1,-1e-8,0,1e-8,1,10]){
      const e=step(.5,.001,20+dp,20,p);expect(e.valid).toBe(true);expect(e.finite).toBe(true);
      expect(Math.abs(e.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-10);
      expect(e.flowMlPerSec).toBeGreaterThanOrEqual(0);
      if(dp<=0)expect(e.flowMlPerSec).toBe(0);
      if(dp>0)expect(e.dissipativePressureMmHg).toBeCloseTo(dp,9);
    }
  });
});

describe('pulmonary compliance amplitude owner, not global stiffness fitting',()=>{
  const runtime={venousTone:.15,arterialStiffness:1.42,systemicArterialComplianceResearchScale:.65};
  it.each([.75,1,1.5] as const)('changes only PA/PArt amplitude at scale %s',scale=>{
    for(const n of buildNodes().filter(n=>['arterial','linear','venousPressure'].includes(n.kind))){
      const a=law(n,runtime),b=law(n,{...runtime,pulmonaryArterialComplianceResearchScale:scale});
      if(n.name==='PA'||n.name==='PArt'){
        expect(a.kind).toBe('arterial');expect(b).toEqual({...a,VsEff:(a as any).VsEff*scale});
      }else expect(b).toEqual(a);
    }
  });
  it('rejects undeclared scales and unsupported selected-profile composition',()=>{
    const n=buildNodes().find(n=>n.name==='PA')!;
    for(const scale of [null,NaN,Infinity,0,.5,2])expect(()=>law(n,{...runtime,pulmonaryArterialComplianceResearchScale:scale as never})).toThrow(/pulmonary compliance/);
    expect(()=>law(n,{...runtime,pulmonaryArterialComplianceResearchScale:1,selectedAorticOutflowProfile:selectedProfile})).toThrow(/compatibility/);
  });
});
