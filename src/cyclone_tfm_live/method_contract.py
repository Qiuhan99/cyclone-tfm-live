"""Identity of the user-approved research method; archives keep separate IDs."""
PROTOCOL='direct_vector_feedback_v1'
BASE='TabPFN Direct-F2'
FEEDBACK='TabPFN Direct-F2 + RF'


def validate_core(model):
    own=[p for p in model['paths'] if p['model_id'].startswith('TabPFN')]
    if model.get('protocol_id')!=PROTOCOL or {p['model_id'] for p in own}!={BASE,FEEDBACK}:
        raise ValueError('expected direct TabPFN and vector residual feedback')
    contract=model.get('algorithm_contract',{})
    if (contract.get('constant_velocity_offset') is not False or contract.get('base_prediction_as_correction_input') is not False
            or contract.get('correction_features')!=68 or contract.get('correction_weight')!=1.0):
        raise ValueError('research algorithm contract mismatch')
    if any(p.get('protocol_id')!=PROTOCOL for p in own):raise ValueError('mixed research protocols')
    if len({p['issue_time_utc'] for p in own})!=1:raise ValueError('baseline and feedback must share the same origin')
    return own
