-- Digital Stress Test Database Schema
-- Run this SQL in your Supabase SQL Editor to create all tables

-- Table 1: Participants (main table)
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Demographics
    age INTEGER,
    gender TEXT,
    prior_participation BOOLEAN,

    -- Device/Browser Info
    device TEXT,
    operating_system TEXT,
    browser TEXT,
    language TEXT,

    -- Study Metadata
    study_title TEXT,
    study_uuid TEXT,
    worker_id TEXT,

    -- Timing Data
    reference_time BIGINT,
    test_start BIGINT,
    test_end BIGINT,
    math_task_start BIGINT,
    math_task_end BIGINT,
    speech_task_start BIGINT,
    speech_task_end BIGINT,
    panas_baseline_start BIGINT,
    panas_baseline_end BIGINT,
    panas_end_start BIGINT,
    panas_end_end BIGINT,
    cancel_dialog_times JSONB DEFAULT '[]'::jsonb,

    -- Math Task Score
    math_task_score FLOAT
);

-- Table 2: VAS (Visual Analogue Scale) Scores
CREATE TABLE vas_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    timepoint TEXT NOT NULL, -- 'baseline', 'intermediate', or 'end'
    stress FLOAT,
    frustrated FLOAT,
    overstrained FLOAT,
    ashamed FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: PANAS Scores
CREATE TABLE panas_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    timepoint TEXT NOT NULL, -- 'begin_panas' or 'end_panas'
    active INTEGER,
    upset INTEGER,
    hostile INTEGER,
    inspired INTEGER,
    ashamed INTEGER,
    alert INTEGER,
    nervous INTEGER,
    determined INTEGER,
    attentive INTEGER,
    afraid INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Math Task Performance
CREATE TABLE math_task_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    question_number INTEGER,
    begin_total_time BIGINT,
    end_total_time BIGINT,
    time_paused BIGINT,
    time_available BIGINT,
    time_needed BIGINT,
    task_question TEXT,
    task_answer TEXT,
    task_input TEXT,
    task_feedback TEXT,
    correct_answer BOOLEAN,
    user_interaction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 5: Speech Task Feedback
CREATE TABLE speech_task_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    stage TEXT,
    feedback BOOLEAN,
    noise_level FLOAT,
    relative_time BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 6: Speech Task Analysis (summary metrics)
CREATE TABLE speech_task_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,

    -- Question 1
    speaking_tick_counter_q1 INTEGER,
    speak_break_counter_q1 INTEGER,
    audio_mean_q1 FLOAT,
    volume_high_q1 FLOAT,

    -- Question 2
    speaking_tick_counter_q2 INTEGER,
    speak_break_counter_q2 INTEGER,
    audio_mean_q2 FLOAT,
    volume_high_q2 FLOAT,

    -- Question 3
    speaking_tick_counter_q3 INTEGER,
    speak_break_counter_q3 INTEGER,
    audio_mean_q3 FLOAT,
    volume_high_q3 FLOAT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_participants_created_at ON participants(created_at DESC);
CREATE INDEX idx_vas_participant_id ON vas_scores(participant_id);
CREATE INDEX idx_panas_participant_id ON panas_scores(participant_id);
CREATE INDEX idx_math_participant_id ON math_task_performance(participant_id);
CREATE INDEX idx_speech_feedback_participant_id ON speech_task_feedback(participant_id);
CREATE INDEX idx_speech_analysis_participant_id ON speech_task_analysis(participant_id);

-- Enable Row Level Security (optional, for added security)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vas_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE panas_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_task_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_task_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_task_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies to allow inserts from the frontend (public access for data collection)
-- Note: In production, you'd want to use service role key or more restrictive policies
CREATE POLICY "Allow public insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON vas_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON panas_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON math_task_performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON speech_task_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON speech_task_analysis FOR INSERT WITH CHECK (true);

-- Create a view for easy CSV export (combines all data)
CREATE OR REPLACE VIEW participant_complete_data AS
SELECT
    p.id,
    p.created_at,
    p.age,
    p.gender,
    p.prior_participation,
    p.device,
    p.operating_system,
    p.browser,
    p.language,
    p.reference_time,
    p.test_start,
    p.test_end,
    p.math_task_start,
    p.math_task_end,
    p.speech_task_start,
    p.speech_task_end,
    p.math_task_score,

    -- VAS Baseline
    vb.stress as vas_baseline_stress,
    vb.frustrated as vas_baseline_frustrated,
    vb.overstrained as vas_baseline_overstrained,
    vb.ashamed as vas_baseline_ashamed,

    -- VAS Intermediate
    vi.stress as vas_intermediate_stress,
    vi.frustrated as vas_intermediate_frustrated,
    vi.overstrained as vas_intermediate_overstrained,
    vi.ashamed as vas_intermediate_ashamed,

    -- VAS End
    ve.stress as vas_end_stress,
    ve.frustrated as vas_end_frustrated,
    ve.overstrained as vas_end_overstrained,
    ve.ashamed as vas_end_ashamed,

    -- PANAS Begin
    pb.active as panas_begin_active,
    pb.upset as panas_begin_upset,
    pb.hostile as panas_begin_hostile,
    pb.inspired as panas_begin_inspired,
    pb.ashamed as panas_begin_ashamed,
    pb.alert as panas_begin_alert,
    pb.nervous as panas_begin_nervous,
    pb.determined as panas_begin_determined,
    pb.attentive as panas_begin_attentive,
    pb.afraid as panas_begin_afraid,

    -- PANAS End
    pe.active as panas_end_active,
    pe.upset as panas_end_upset,
    pe.hostile as panas_end_hostile,
    pe.inspired as panas_end_inspired,
    pe.ashamed as panas_end_ashamed,
    pe.alert as panas_end_alert,
    pe.nervous as panas_end_nervous,
    pe.determined as panas_end_determined,
    pe.attentive as panas_end_attentive,
    pe.afraid as panas_end_afraid,

    -- Speech Analysis
    sa.speaking_tick_counter_q1,
    sa.speak_break_counter_q1,
    sa.audio_mean_q1,
    sa.volume_high_q1,
    sa.speaking_tick_counter_q2,
    sa.speak_break_counter_q2,
    sa.audio_mean_q2,
    sa.volume_high_q2,
    sa.speaking_tick_counter_q3,
    sa.speak_break_counter_q3,
    sa.audio_mean_q3,
    sa.volume_high_q3

FROM participants p
LEFT JOIN vas_scores vb ON p.id = vb.participant_id AND vb.timepoint = 'baseline'
LEFT JOIN vas_scores vi ON p.id = vi.participant_id AND vi.timepoint = 'intermediate'
LEFT JOIN vas_scores ve ON p.id = ve.participant_id AND ve.timepoint = 'end'
LEFT JOIN panas_scores pb ON p.id = pb.participant_id AND pb.timepoint = 'begin_panas'
LEFT JOIN panas_scores pe ON p.id = pe.participant_id AND pe.timepoint = 'end_panas'
LEFT JOIN speech_task_analysis sa ON p.id = sa.participant_id
ORDER BY p.created_at DESC;
