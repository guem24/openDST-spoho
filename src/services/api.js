/**
 * API Service for Digital Stress Test
 * Replaces JATOS backend with Supabase
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

class SupabaseAPI {
    constructor() {
        this.baseUrl = SUPABASE_URL;
        this.headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        this.participantId = null;

        // Debug logging
        console.log('SupabaseAPI initialized');
        console.log('Base URL:', this.baseUrl);
        console.log('API Key present:', !!SUPABASE_ANON_KEY);
    }

    /**
     * Initialize a new participant session
     * Creates a participant record and returns the ID
     */
    async initializeParticipant(metadata) {
        try {
            console.log('Attempting to create participant with metadata:', metadata);

            const response = await fetch(`${this.baseUrl}/rest/v1/participants`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    age: metadata.age,
                    gender: metadata.gender,
                    prior_participation: metadata.participated,
                    device: metadata.device,
                    operating_system: metadata.operatingSystem,
                    browser: metadata.browser,
                    language: metadata.language,
                    study_title: metadata.studyTitle,
                    study_uuid: metadata.studyUuid,
                    worker_id: metadata.workerId,
                    reference_time: metadata.referenceTime
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create participant:', response.status, errorText);
                throw new Error(`Failed to create participant: ${response.statusText}`);
            }

            const data = await response.json();
            this.participantId = data[0].id;
            console.log('Participant created with ID:', this.participantId);
            return this.participantId;
        } catch (error) {
            console.error('Error initializing participant:', error);
            throw error;
        }
    }

    /**
     * Update participant timing data
     */
    async updateParticipantTiming(timingData) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping timing update');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/participants?id=eq.${this.participantId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    test_start: timingData.test_start,
                    test_end: timingData.test_end,
                    math_task_start: timingData.mathTask_start,
                    math_task_end: timingData.mathTask_end,
                    speech_task_start: timingData.speechTask_start,
                    speech_task_end: timingData.speechTask_end,
                    panas_baseline_start: timingData.panasBaseline_start,
                    panas_baseline_end: timingData.panasBaseline_end,
                    panas_end_start: timingData.panasEnd_start,
                    panas_end_end: timingData.panasEnd_end,
                    cancel_dialog_times: timingData.cancel_dialog || []
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update timing: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating participant timing:', error);
        }
    }

    /**
     * Save VAS (Visual Analogue Scale) scores
     */
    async saveVASScores(timepoint, scores) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping VAS save');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/vas_scores`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    participant_id: this.participantId,
                    timepoint: timepoint,
                    stress: scores.stress,
                    frustrated: scores.frustrated,
                    overstrained: scores.overstrained,
                    ashamed: scores.ashamed
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save VAS scores: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error saving VAS scores:', error);
        }
    }

    /**
     * Save PANAS scores
     */
    async savePANASScores(timepoint, scores) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping PANAS save');
            return;
        }

        try {
            console.log('Attempting to save PANAS scores for', timepoint, ':', scores);

            // Ensure all values are integers (convert if needed for backwards compatibility)
            const sanitizedScores = {
                active: typeof scores.active === 'number' ? scores.active : parseInt(String(scores.active).replace('checked', ''), 10),
                upset: typeof scores.upset === 'number' ? scores.upset : parseInt(String(scores.upset).replace('checked', ''), 10),
                hostile: typeof scores.hostile === 'number' ? scores.hostile : parseInt(String(scores.hostile).replace('checked', ''), 10),
                inspired: typeof scores.inspired === 'number' ? scores.inspired : parseInt(String(scores.inspired).replace('checked', ''), 10),
                ashamed: typeof scores.ashamed === 'number' ? scores.ashamed : parseInt(String(scores.ashamed).replace('checked', ''), 10),
                alert: typeof scores.alert === 'number' ? scores.alert : parseInt(String(scores.alert).replace('checked', ''), 10),
                nervous: typeof scores.nervous === 'number' ? scores.nervous : parseInt(String(scores.nervous).replace('checked', ''), 10),
                determined: typeof scores.determined === 'number' ? scores.determined : parseInt(String(scores.determined).replace('checked', ''), 10),
                attentive: typeof scores.attentive === 'number' ? scores.attentive : parseInt(String(scores.attentive).replace('checked', ''), 10),
                afraid: typeof scores.afraid === 'number' ? scores.afraid : parseInt(String(scores.afraid).replace('checked', ''), 10)
            };

            console.log('Sanitized PANAS scores:', sanitizedScores);

            const response = await fetch(`${this.baseUrl}/rest/v1/panas_scores`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    participant_id: this.participantId,
                    timepoint: timepoint,
                    active: sanitizedScores.active,
                    upset: sanitizedScores.upset,
                    hostile: sanitizedScores.hostile,
                    inspired: sanitizedScores.inspired,
                    ashamed: sanitizedScores.ashamed,
                    alert: sanitizedScores.alert,
                    nervous: sanitizedScores.nervous,
                    determined: sanitizedScores.determined,
                    attentive: sanitizedScores.attentive,
                    afraid: sanitizedScores.afraid
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to save PANAS scores:', response.status, errorText);
                throw new Error(`Failed to save PANAS scores: ${response.statusText}`);
            }

            console.log('PANAS scores saved successfully for', timepoint);
        } catch (error) {
            console.error('Error saving PANAS scores:', error);
            throw error; // Re-throw to propagate the error
        }
    }

    /**
     * Save math task performance data
     */
    async saveMathTaskPerformance(performanceData) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping math task save');
            return;
        }

        try {
            console.log('Raw math task data:', performanceData);

            // Filter out the initial empty object
            const validData = performanceData.filter(item => item.subject_id !== null);

            console.log('Filtered math task data:', validData);

            if (validData.length === 0) {
                console.warn('No valid math task data to save');
                return;
            }

            const dataToInsert = validData.map(item => ({
                participant_id: this.participantId,
                question_number: parseInt(item.question_number, 10),
                begin_total_time: Math.round(item.begin_total_time * 1000), // Convert to milliseconds (BIGINT)
                end_total_time: Math.round(item.end_total_time * 1000), // Convert to milliseconds (BIGINT)
                time_paused: Math.round(item.time_paused), // Ensure integer
                time_available: Math.round(item.time_available * 1000), // Convert to milliseconds (BIGINT)
                time_needed: Math.round(item.time_needed * 1000), // Convert to milliseconds (BIGINT)
                task_question: String(item.task_question),
                task_answer: String(item.task_answer),
                task_input: item.task_input ? String(item.task_input) : null,
                task_feedback: item.task_feedback ? String(item.task_feedback) : null,
                correct_answer: Boolean(item.correct_answer),
                user_interaction: String(item.user_interaction) // Convert boolean to string for TEXT column
            }));

            console.log('Attempting to save math task performance:', dataToInsert.length, 'records');
            console.log('Sample record:', dataToInsert[0]);

            const response = await fetch(`${this.baseUrl}/rest/v1/math_task_performance`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(dataToInsert)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to save math task performance:', response.status, errorText);
                throw new Error(`Failed to save math task performance: ${response.statusText}`);
            }

            console.log('Math task performance saved successfully!');
        } catch (error) {
            console.error('Error saving math task performance:', error);
            throw error; // Re-throw to propagate the error
        }
    }

    /**
     * Save speech task feedback data (real-time feedback events)
     */
    async saveSpeechTaskFeedback(feedbackData) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping speech task feedback save');
            return;
        }

        try {
            // Filter out the initial empty object
            const validData = feedbackData.filter(item => item.subjectId !== null);

            const dataToInsert = validData.map(item => ({
                participant_id: this.participantId,
                stage: item.stage,
                feedback: item.feedback,
                noise_level: item.noiseLevel,
                relative_time: item.relativeTime
            }));

            const response = await fetch(`${this.baseUrl}/rest/v1/speech_task_feedback`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(dataToInsert)
            });

            if (!response.ok) {
                throw new Error(`Failed to save speech task feedback: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error saving speech task feedback:', error);
        }
    }

    /**
     * Save speech task analysis (summary metrics)
     */
    async saveSpeechTaskAnalysis(analysisData) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping speech task analysis save');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/speech_task_analysis`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    participant_id: this.participantId,
                    speaking_tick_counter_q1: analysisData.speakingTickCounterQ1,
                    speak_break_counter_q1: analysisData.speakBreakCounterQ1,
                    audio_mean_q1: analysisData.audioMeanQ1,
                    volume_high_q1: analysisData.volumeHighQ1,
                    speaking_tick_counter_q2: analysisData.speakingTickCounterQ2,
                    speak_break_counter_q2: analysisData.speakBreakCounterQ2,
                    audio_mean_q2: analysisData.audioMeanQ2,
                    volume_high_q2: analysisData.volumeHighQ2,
                    speaking_tick_counter_q3: analysisData.speakingTickCounterQ3,
                    speak_break_counter_q3: analysisData.speakBreakCounterQ3,
                    audio_mean_q3: analysisData.audioMeanQ3,
                    volume_high_q3: analysisData.volumeHighQ3
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save speech task analysis: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error saving speech task analysis:', error);
        }
    }

    /**
     * Update math task score
     */
    async updateMathTaskScore(score) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping math task score update');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/participants?id=eq.${this.participantId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    math_task_score: score
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update math task score: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating math task score:', error);
        }
    }

    /**
     * Upload all final data (called at the end of the study)
     */
    async uploadFinalData(studyData) {
        if (!this.participantId) {
            console.warn('No participant ID set, skipping final data upload');
            return;
        }

        try {
            // Update timing data
            await this.updateParticipantTiming(studyData.studyTimes);

            // Save VAS scores for all timepoints
            if (studyData.vasFeedback.baseline.stress !== null) {
                await this.saveVASScores('baseline', studyData.vasFeedback.baseline);
            }
            if (studyData.vasFeedback.intermediate.stress !== null) {
                await this.saveVASScores('intermediate', studyData.vasFeedback.intermediate);
            }
            if (studyData.vasFeedback.end.stress !== null) {
                await this.saveVASScores('end', studyData.vasFeedback.end);
            }

            // Save PANAS scores
            if (studyData.panasFeedback.begin_panas.active !== null) {
                await this.savePANASScores('begin_panas', studyData.panasFeedback.begin_panas);
            }
            if (studyData.panasFeedback.end_panas.active !== null) {
                await this.savePANASScores('end_panas', studyData.panasFeedback.end_panas);
            }

            // Save math task performance
            await this.saveMathTaskPerformance(studyData.mathTaskPerformance);

            // Save speech task feedback
            await this.saveSpeechTaskFeedback(studyData.speechTaskFeedback);

            // Save speech task analysis
            if (studyData.speechTestAnalysis && studyData.speechTestAnalysis.speakingTickCounterQ1 !== null) {
                await this.saveSpeechTaskAnalysis(studyData.speechTestAnalysis);
            }

            // Update math task score
            if (studyData.mathTaskScore !== null) {
                await this.updateMathTaskScore(studyData.mathTaskScore);
            }

            console.log('Final data upload complete for participant:', this.participantId);
        } catch (error) {
            console.error('Error uploading final data:', error);
            throw error;
        }
    }

    /**
     * Get the current participant ID (acts like jatos.studyResultId)
     */
    getParticipantId() {
        return this.participantId;
    }

    /**
     * Set participant ID (if needed for recovery)
     */
    setParticipantId(id) {
        this.participantId = id;
    }
}

// Create a singleton instance
const apiService = new SupabaseAPI();

export default apiService;
