export const FORM_COLLECTION_TO_KEY = {
  registrationForm: 'registration',
  triageForm: 'triage',
  hsgForm: 'hsg',
  lungFnForm: 'lungFunction',
  wceForm: 'wce',
  gynaeForm: 'gynae',
  podiatryForm: 'podiatry',
  dietitiansConsultForm: 'dietitiansConsult',
  oralHealthForm: 'oralHealth',
  socialServiceForm: 'socialService',
  mentalHealthForm: 'mentalHealth',
  mammobusForm: 'mammobus',
  hpvForm: 'hpv',
  audiometryForm: 'audiometry',
  vaccineForm: 'vaccine',
  doctorConsultForm: 'doctorConsult',
  summaryForm: 'summary',
  ophthalForm: 'ophthal',
  osteoForm: 'osteo',
  hxNssForm: 'hxNss',
  hxSocialForm: 'hxSocial',
  hxFamilyForm: 'hxFamily',
  hxHcsrForm: 'hxHcsr',
  hxOralForm: 'hxOral',
  hxM4M5ReviewForm: 'hxM4M5Review',
  geriPhqForm: 'geriPhq',
  geriAmtForm: 'geriAmt',
  geriGraceForm: 'geriGrace',
  geriWhForm: 'geriWh',
  geriInterForm: 'geriInter',
  geriPhysicalActivityLevelForm: 'geriPhysicalActivityLevel',
  geriOtQuestionnaireForm: 'geriOtQuestionnaire',
  geriSppbForm: 'geriSppb',
  geriPtConsultForm: 'geriPtConsult',
  geriOtConsultForm: 'geriOtConsult',
}

export function toFormKey(collectionName) {
  return FORM_COLLECTION_TO_KEY[collectionName] || collectionName
}

export function hasFormKey(collectionName) {
  return Boolean(FORM_COLLECTION_TO_KEY[collectionName])
}
