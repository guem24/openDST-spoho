import React from 'react';
import StartPage from "./pages/StartPage";
import Introduction from "./pages/Introduction";
import MathTaskTutorial from "./pages/MathTaskTutorial";
import MathTask from "./pages/MathTask";
import MathTaskResult from "./pages/MathTaskResult";
import SpeechTaskTutorial from "./pages/SpeechTaskTutorial";
import SpeechTask from "./pages/SpeechTask";
import EndPage from "./pages/EndPage";
import StepperWithLabels from "./components/StepperWithLabels";
import CancelDialog from "./components/CancelDialog.js";
import { UAParser } from 'ua-parser-js';
import apiService from './services/api';

/**
 * The main component holds most of the data that is collected during the study run. It's the parent component of the
 * different pages of the DST (like Mathtask or Speechtask).
 */
class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            /**
             * pageIndex stores the index of the current active page during the study run.
             */
            pageIndex: 0,

            /**
             * The studyPagesSequence array represents the sequence in which the pages are shown during the study run.
             * pageIndex is used as the index for the studyPagesSequence array to determine the current active page.
             * By changing the elements of this array in the source code, pages can be removed or the order of the pages
             * can be changed. (Note: Not all possible sequences might automatically work as intended. When changing the
             * sequence of pages here, additional changes might be necessary)
             */
            studyPagesSequence: ['startPage', 'introduction', 'mathTaskTutorial', 'mathTask', 'mathTaskResult', 'speechTaskTutorial', 'speechTask', 'endPage'],

            /**
             * Within a page there can be different slides. slideIndex stores the index of the current active slide of
             * the current active page. For each separate page the slideIndex starts at 0.
             */
            slideIndex: 0,

            /**
             * The slideSequences object maps the names of the pages to arrays that represent the sequence of slides within that particular page.
             * All possible slides for a particular page are contained in its array (some are commented out). To remove
             * a slide from a page it can be simply uncommented in the array. If a page is present in the studyPagesSequence array
             * then it should have at least one slide in its corresponding array here. (Note: Changing the sequence of slides might not always
             * automatically work as intended. Additional changes may be necessary)
             */
            slideSequences: {
                startPage: [
                    'startPage'
                ],
                introduction: [
                    'intro',
                    'consent',
                    'vas',
                    'panas',
                    'calibration',
                ],
                mathTaskTutorial: [
                    // 'transition',
                    'intro',
                    // 'vas',
                    'comparison',
                    'countdown',
                ],
                mathTask: [
                    'mathTask'
                ],
                mathTaskResult: [
                    'mathTaskResult'
                ],
                speechTaskTutorial: [
                    'vas',
                    'transition',
                    'intro',
                ],
                speechTask: [
                    'speechTask'
                ],
                endPage: [
                    'vas',
                    'panas',
                    'explanation',
                    'questionnaire',
                ]
            },

            /**
             * An array of booleans that will indicate whether the video uploads were successful or not. The n-th video
             * upload corresponds to the element at index n.
             *
             * areAllVideosUploaded is derived from uploadedVideos.
             */
            uploadedVideos: [],
            areAllVideosUploaded: true,

            /**
             * cancelDialogIsOpen is passed to the cancelDialog component as a prop and controls if it is open or closed.
             * It is also passed to some other components to interrupt the study process when the dialog has opened.
             */
            cancelDialogIsOpen: false,
        };
        this.handleNext = this.handleNext.bind(this);
        this.genderAndAgeHandler = this.genderAndAgeHandler.bind(this)
        this.handBackStressData = this.handBackStressData.bind(this)
        this.uploadData = this.uploadData.bind(this)
        this.startMathTask = this.startMathTask.bind(this);
        this.startSpeechTask = this.startSpeechTask.bind(this);
        this.uploadFinalData = this.uploadFinalData.bind(this);
        this.updateMathTaskPerformance = this.updateMathTaskPerformance.bind(this);
        this.updateSpeechTaskFeedback = this.updateSpeechTaskFeedback.bind(this);
        this.handleCancelDialog = this.handleCancelDialog.bind(this)
        this.endSpeechTask = this.endSpeechTask.bind(this)
        this.updateStudyTracker = this.updateStudyTracker.bind(this)
        this.continueFromPanas = this.continueFromPanas.bind(this)
        this.handlerCheckBoxForPriorParticipation = this.handlerCheckBoxForPriorParticipation.bind(this)
        this.markVideoAsUploading = this.markVideoAsUploading.bind(this)
        this.markVideoAsUploaded = this.markVideoAsUploaded.bind(this)
        this.speechTestAnalysisCallback = this.speechTestAnalysisCallback.bind(this)
        this.endMathTask = this.endMathTask.bind(this)
        this.setStudyTimes = this.setStudyTimes.bind(this)

        /**
         * The data object holds various data that is collected during a study run including results from the math- and
         * speechtasks.
         */
        this.data = {
            mathTaskPerformance: [{
                subject_id: null,
                question_number: null,
                begin_total_time: null,
                end_total_time: null,
                time_paused: null,
                time_available: null,
                time_needed: null,
                task_question: null,
                task_answer: null,
                task_input: null,
                task_feedback: null,
                correct_answer: null,
                user_interaction: null
            }],
            speechTaskFeedback: [{
                subjectId: null,
                stage: null,
                feedback: null,
                noiseLevel: null,
                relativeTime: null
            }],

            /**
             * studyTimes logs the time points of a study run. reference holds the unix time at the beginning of the study.
             * Each other time point holds the difference between the unix time then and the reference time point.
             */
            studyTimes: {
                reference: null,
                panasBaseline_start: null,
                panasBaseline_end: null,
                test_start: null,
                test_end: null,
                mathTask_start: null,
                mathTask_end: null,
                speechTask_start: null,
                speechTask_end: null,
                panasEnd_start: null,
                panasEnd_end: null,
                cancel_dialog: []
            },

            /**
             * vasFeedback holds the feedback of the Visual Analogue Scale which can be assessed at the beginning (baseline),
             * in the middle (intermediate) or at the end of the study run.
             */
            vasFeedback: {
                'baseline': {stress: null, frustrated: null, overstrained: null, ashamed: null},
                'intermediate': {stress: null, frustrated: null, overstrained: null, ashamed: null},
                'end': {stress: null, frustrated: null, overstrained: null, ashamed: null},
            },

            /**
             * panasFeedback holds the feedback of the Positive And Negative Affect Schedule which can be assessed at the
             * beginning and end of the study run.
             */
            panasFeedback: {
                begin_panas: {
                    'active': null,
                    'upset': null,
                    'hostile': null,
                    'inspired': null,
                    'ashamed': null,
                    'alert': null,
                    'nervous': null,
                    'determined': null,
                    'attentive': null,
                    'afraid': null
                },
                end_panas: {
                    'active': null,
                    'upset': null,
                    'hostile': null,
                    'inspired': null,
                    'ashamed': null,
                    'alert': null,
                    'nervous': null,
                    'determined': null,
                    'attentive': null,
                    'afraid': null
                }
            },

            /**
             * studyMetaTracker holds metadata of the study run from the backend like the study result ID (Note: Most
             * of the IDs are not UUIDs. They are only unique with regard to a JATOS server instance). Also some personal
             * information ist stored like age and gender.
             */
            studyMetaTracker: {
                studyId: null,
                studyTitle: null,
                studyUuid: null,
                componentId: null,
                studyResultId: null,
                workerId: null,
                device: null,
                operatingSystem: null,
                surveyURL: null,
                browser: null,
                language: null,
                age: null,
                gender: null,
                videosSubmitted: null,
            },
            checkBoxForPriorParticipation: {participated:null},
            mathTaskScore: null,

            /**
             * speechTestAnalysis holds data that is only used for displaying feedback about the speech task at the end of the test
             */
            speechTestAnalysis: {
                // for the first question
                speakingTickCounterQ1: null,  // for ratio between speaking and not speaking
                speakBreakCounterQ1: null,   // counter for all speak breaks
                audioMeanQ1: null,           // mean volume
                volumeHighQ1: null,          // a number which should store the biggest measurement of volume
                // for the second question
                speakingTickCounterQ2: null,
                speakBreakCounterQ2: null,
                audioMeanQ2: null,
                volumeHighQ2: null,
                // for the third question
                speakingTickCounterQ3: null,
                speakBreakCounterQ3: null,
                audioMeanQ3: null,
                volumeHighQ3: null,
            }
        }
    }

    /**
     * This function pushes a new false entry to the this.state.uploadedVideos array indicating that a new video is being uploaded
     * but not yet successfully so.
     * @returns {number} the index of the false entry
     */
    markVideoAsUploading() {
        this.setState(prevState => ({
            uploadedVideos: [...prevState.uploadedVideos, false]
        }), () => this.setState(prevState => ({
                areAllVideosUploaded: prevState.uploadedVideos.reduce((accumulator, currentValue) => accumulator && currentValue, true),
            }))
        )
        return this.state.uploadedVideos.length - 1;
    }

    /**
     * This function changes a particular entry of the this.state.uploadedVideos array to true, indicating that the particular
     * video has been successfully uploaded.
     * It also updates the this.state.areAllVideosUploaded variable.
     * @param index the index of the entry that will be changed to true
     */
    markVideoAsUploaded(index) {
        this.setState(prevState => {
            let copy = [...prevState.uploadedVideos];
            copy[index] = true;
            return {uploadedVideos: copy};
        }, () => this.setState(prevState => ({
            areAllVideosUploaded: prevState.uploadedVideos.reduce((accumulator, currentValue) => accumulator && currentValue, true),
            }))
        )
    }

    /**
     * Is passed to the startPage component to save the metadata of the study run
     * @param language the chosen language
     */
    async updateStudyTracker(language) {
        let ua = new UAParser().getResult();

        // Initialize metadata
        const studyTitle = "Digital Stress Test - Sporthochschule Köln";
        const studyUuid = Date.now().toString(); // Use timestamp as unique identifier
        const referenceTime = Date.now();

        this.data.studyTimes.reference = referenceTime;

        if(process.env.REACT_APP_LOGGING === "true") {
            try {
                // Initialize participant in Supabase
                const participantId = await apiService.initializeParticipant({
                    device: ua.device.type || 'unknown',
                    operatingSystem: ua.os.name || 'unknown',
                    browser: `${ua.browser.name || 'unknown'} ${ua.browser.version || ''}`,
                    language: language,
                    studyTitle: studyTitle,
                    studyUuid: studyUuid,
                    workerId: null,
                    referenceTime: referenceTime
                });

                // Store metadata locally for the session
                this.data.studyMetaTracker = {
                    studyId: null,
                    studyTitle: studyTitle,
                    studyUuid: studyUuid,
                    componentId: null,
                    studyResultId: participantId, // Use Supabase participant ID
                    workerId: null,
                    device: ua.device.type || 'unknown',
                    operatingSystem: ua.os.name || 'unknown',
                    surveyURL: this.createSurveyURL(null, participantId, process.env.REACT_APP_SURVEY_HOST_PATH),
                    browser: `${ua.browser.name || 'unknown'} ${ua.browser.version || ''}`,
                    language: language,
                    age: null,
                    gender: null,
                    videosSubmitted: null,
                };

                console.log('Participant initialized:', participantId);
            } catch (error) {
                console.error('Error initializing participant:', error);
                // Still set local metadata even if API call fails
                this.data.studyMetaTracker = {
                    studyId: null,
                    studyTitle: studyTitle,
                    studyUuid: studyUuid,
                    componentId: null,
                    studyResultId: 'local-' + Date.now(),
                    workerId: null,
                    device: ua.device.type || 'unknown',
                    operatingSystem: ua.os.name || 'unknown',
                    surveyURL: '',
                    browser: `${ua.browser.name || 'unknown'} ${ua.browser.version || ''}`,
                    language: language,
                    age: null,
                    gender: null,
                    videosSubmitted: null,
                };
            }
        }
    }

    /**
     * This function causes a slide or page transition by incrementing the appropriate indexes based on whether its the
     * last slide of a page or not.
     */
    handleNext() {
        if (this.state.slideIndex + 1 === this.state.slideSequences[this.state.studyPagesSequence[this.state.pageIndex]].length) {
            this.setState({
                pageIndex: this.state.pageIndex + 1,
                slideIndex: 0
            })
        } else {
            this.setState({
                slideIndex: this.state.slideIndex + 1,
            })
        }
    };

    /**
     * Creates the URL of the survey to which the participant is directed after the study. Depending on the survey provider
     * this might have to be adapted. The base path of the URL can be changed in the REACT_APP_SURVEY_HOST_PATH environment variable
     * in the .env-file.
     * @param studyID The ID of the JATOS study.
     * @param studyResultId The ID of a particular study run.
     * @param surveyHostPath The hostname and path of the survey. Can be specified in .env-file and then be accessed in
     * the process.env-object
     * @returns {string} The URL as a string.
     */
    createSurveyURL(studyID, studyResultId, surveyHostPath) {
        let mod_StudyId;
        if (studyID.toString().length === 1) {
            mod_StudyId = 0 + studyID.toString();
        } else {
            mod_StudyId = studyID;
        }
        let modStudyResultId = '' + studyResultId;
        while (modStudyResultId.length < 6) {
            modStudyResultId = '0' + modStudyResultId;
        }
        const surveyID = mod_StudyId + modStudyResultId;
        return surveyHostPath + "?q=DST_video&r=" + surveyID;
    }

    /**
     *
     * @param {string} timeVariable Has to correspond to one of the props of this.data.studyTimes.
     * @param timeStamp Can be null or the time that has passed in milliseconds since the reference time point.
     */
    setStudyTimes(timeVariable, timeStamp) {
        if (timeStamp === null) {
            this.data.studyTimes[timeVariable] = Date.now() - this.data.studyTimes.reference;
        } else {
            this.data.studyTimes[timeVariable] = timeStamp;
        }
    }

    /**
     * Uploads data (mathtask, speechtask and metadata) to the Supabase backend.
     * @param {string} timeVariable see function setStudyTimes
     * @param timeStamp see function setStudyTimes
     */
    async uploadData(timeVariable, timeStamp) {
        this.setStudyTimes(timeVariable, timeStamp);

        if(process.env.REACT_APP_LOGGING === "true") {
            try {
                // Update timing data
                await apiService.updateParticipantTiming(this.data.studyTimes);
                console.log('Data uploaded successfully');
            } catch (error) {
                console.error('Error uploading data:', error);
            }
        }
    }

    /**
     * Is called at the end of the study or when cancelling the study to upload all the study data to Supabase.
     * @param dataConfig This parameter is kept for compatibility but not used with Supabase
     * @param isVideoDataSubmitted true or false depending on whether videos are submitted or not.
     */
    async uploadFinalData(dataConfig, isVideoDataSubmitted) {
        this.data.studyTimes.test_end = Date.now() - this.data.studyTimes.reference;
        this.data.studyMetaTracker.videosSubmitted = isVideoDataSubmitted;

        if(process.env.REACT_APP_LOGGING === "true") {
            try {
                // Upload all study data to Supabase
                await apiService.uploadFinalData({
                    studyTimes: this.data.studyTimes,
                    studyMetaTracker: this.data.studyMetaTracker,
                    vasFeedback: this.data.vasFeedback,
                    panasFeedback: this.data.panasFeedback,
                    checkBoxForPriorParticipation: this.data.checkBoxForPriorParticipation,
                    mathTaskPerformance: this.data.mathTaskPerformance,
                    speechTaskFeedback: this.data.speechTaskFeedback,
                    speechTestAnalysis: this.data.speechTestAnalysis,
                    mathTaskScore: this.data.mathTaskScore
                });

                console.log('Final data uploaded successfully');
            } catch (error) {
                console.error('Error uploading final data:', error);
            }
        }
    }

    /**
     * Opens or closes the cancel dialog and logs the relative time points.
     */
    handleCancelDialog() {
        if (!this.state.cancelDialogIsOpen) {
            this.logCancelOpen();
            this.setState({
                cancelDialogIsOpen: true,
            });
        } else {
            this.logCancelClose()
            this.setState({
                cancelDialogIsOpen: false,
            });
        }
    }

    /**
     * Logs the time point (as difference in milliseconds between now and the reference time point), whenever the
     * cancel button isvpressed to open the cancel dialog.
     */
    logCancelOpen() {
        let cancel_log = {
            cancel_opened: Date.now() - this.data.studyTimes.reference,
            cancel_closed: null,
        }
        this.data.studyTimes.cancel_dialog.push(cancel_log);
    }

    /**
     * Logs the time point (as difference in milliseconds between now and the reference time point), whenever the
     * cancel dialog closes.
     */
    logCancelClose() {
        this.data.studyTimes.cancel_dialog[this.data.studyTimes.cancel_dialog.length - 1].cancel_closed = Date.now() - this.data.studyTimes.reference;
    }

    startMathTask() {
        window.scrollTo(0, 0)
        this.data.mathTaskPerformance = [];
        this.handleNext();
    }

    endMathTask(mathTaskScore) {
        window.scrollTo(0, 0)
        this.data.mathTaskScore = mathTaskScore;
        this.uploadData('mathTask_end', null)
        this.handleNext();
    }

    updateMathTaskPerformance(bool, noAnswerStreak, elapsedTimeCurrentQuestion, time_paused, questionDuration,
                              currentQuestionIndex, begin_total_time, end_total_time, taskList, numberInput, currentFeedback) {
        let mathTaskEvent = {
            subject_id: this.data.studyMetaTracker.studyResultId,
            question_number: this.data.mathTaskPerformance.length,
            begin_total_time: begin_total_time,
            end_total_time: end_total_time,
            time_paused: time_paused,
            time_available: questionDuration / 1000,
            time_needed: elapsedTimeCurrentQuestion,
            task_question: taskList[currentQuestionIndex].question,
            task_answer: taskList[currentQuestionIndex].answer,
            task_input: numberInput,
            task_feedback: currentFeedback,
            correct_answer: bool,
            user_interaction: noAnswerStreak <= 0
        };
        this.data.mathTaskPerformance.push(mathTaskEvent);
    }

    updateSpeechTaskFeedback(feedback) {
        this.data.speechTaskFeedback.push(feedback);
    }

    startSpeechTask() {
        window.scrollTo(0, 0)
        this.data.speechTaskFeedback = [];
        this.uploadData('speechTask_start', null)
    }

    endSpeechTask() {
        window.scrollTo(0, 0);
        this.uploadData('speechTask_end', null)
        this.handleNext();
    }

    handBackStressData(newValue, stressImpression) {
        this.data.vasFeedback[stressImpression] = newValue;
    }

    continueFromPanas(panasAnswers, timestampBegin) {
        if (this.state.studyPagesSequence[this.state.pageIndex] === 'introduction') {
            this.data.panasFeedback.begin_panas = panasAnswers;
            this.setStudyTimes('panasBaseline_start', timestampBegin)
            this.uploadData('panasBaseline_end', null)
        }
        if (this.state.studyPagesSequence[this.state.pageIndex] === 'endPage') {
            this.data.panasFeedback.end_panas = panasAnswers;
            this.setStudyTimes('panasEnd_start', timestampBegin)
            this.uploadData('panasEnd_end', null)
        }
        window.scrollTo(0, 0)
        this.handleNext()
    }

    async handlerCheckBoxForPriorParticipation(bool) {
        this.data.checkBoxForPriorParticipation.participated = bool;

        // Update in Supabase if logging is enabled
        if(process.env.REACT_APP_LOGGING === "true") {
            try {
                const participantId = apiService.getParticipantId();
                if (participantId) {
                    await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/participants?id=eq.${participantId}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            prior_participation: bool
                        })
                    });
                }
            } catch (error) {
                console.error('Error updating prior participation:', error);
            }
        }
    }

    genderAndAgeHandler = async (age, gender) => {
        this.data.studyMetaTracker.age = age
        this.data.studyMetaTracker.gender = gender

        // Update in Supabase if logging is enabled
        if(process.env.REACT_APP_LOGGING === "true") {
            try {
                const participantId = apiService.getParticipantId();
                if (participantId) {
                    await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/participants?id=eq.${participantId}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            age: age,
                            gender: gender
                        })
                    });
                }
            } catch (error) {
                console.error('Error updating age and gender:', error);
            }
        }
    }

    speechTestAnalysisCallback(data) {
        this.data.speechTestAnalysis = data;
    }

    renderCurrentComponent() {
        switch (this.state.studyPagesSequence[this.state.pageIndex]) {
            case 'startPage':
                return <StartPage
                    updateStudyTracker={this.updateStudyTracker}
                    uploadData={this.uploadData}
                    setStudyTimes={this.setStudyTimes}
                    handleNext={this.handleNext}
                />;
            case 'introduction':
                return <>
                    <StepperWithLabels
                        slideSequences={this.state.slideSequences}
                        slideIndex={this.state.slideIndex}
                        studyPagesSequence={this.state.studyPagesSequence}
                        pageIndex={this.state.pageIndex}
                    />
                    <Introduction
                        activeSlide={this.state.slideSequences[this.state.studyPagesSequence[this.state.pageIndex]][this.state.slideIndex]}
                        handlerCheckBoxForPriorParticipation={this.handlerCheckBoxForPriorParticipation}
                        handBackStressData={this.handBackStressData}
                        referenceTime={this.data.studyTimes.reference}
                        continueFromPanas={this.continueFromPanas}
                        markVideoAsUploading={this.markVideoAsUploading}
                        markVideoAsUploaded={this.markVideoAsUploaded}
                        studyResultId={this.data.studyMetaTracker.studyResultId}
                        handleNext={this.handleNext}
                        language={this.data.studyMetaTracker.language}
                    />
                </>

            case 'mathTaskTutorial':
                return <>
                    <StepperWithLabels
                        slideSequences={this.state.slideSequences}
                        slideIndex={this.state.slideIndex}
                        studyPagesSequence={this.state.studyPagesSequence}
                        pageIndex={this.state.pageIndex}
                    />
                    <MathTaskTutorial
                        handleNext={this.handleNext}
                        activeSlide={this.state.slideSequences[this.state.studyPagesSequence[this.state.pageIndex]][this.state.slideIndex]}
                        genderAndAgeHandler={this.genderAndAgeHandler}
                        handBackStressData={this.handBackStressData}
                        handleCancelDialog={this.handleCancelDialog}
                        startMathTask={this.startMathTask}
                    />
                </>;
            case 'mathTask':
                return <MathTask
                    studyResultId={this.data.studyMetaTracker.studyResultId}
                    uploadData={this.uploadData}
                    updateMathTaskPerformance={this.updateMathTaskPerformance}
                    endMathTask={this.endMathTask}
                    handleCancelDialog={this.handleCancelDialog}
                    cancelDialogIsOpen={this.state.cancelDialogIsOpen}
                    markVideoAsUploading={this.markVideoAsUploading}
                    markVideoAsUploaded={this.markVideoAsUploaded}
                    handleNext={this.handleNext}
                />;
            case 'mathTaskResult':
                return <>
                    <StepperWithLabels
                        slideSequences={this.state.slideSequences}
                        slideIndex={this.state.slideIndex}
                        studyPagesSequence={this.state.studyPagesSequence}
                        pageIndex={this.state.pageIndex}
                    />
                    <MathTaskResult
                        handleNext={this.handleNext}
                        mathTaskScore={this.data.mathTaskScore}
                        handleCancelDialog={this.handleCancelDialog}
                    />
                </>;
            case 'speechTaskTutorial':
                return <>
                    <StepperWithLabels
                        slideSequences={this.state.slideSequences}
                        slideIndex={this.state.slideIndex}
                        studyPagesSequence={this.state.studyPagesSequence}
                        pageIndex={this.state.pageIndex}
                    />
                    <SpeechTaskTutorial
                        activeSlide={this.state.slideSequences[this.state.studyPagesSequence[this.state.pageIndex]][this.state.slideIndex]}
                        handleNext={this.handleNext}
                        handBackStressData={this.handBackStressData}
                        handleCancelDialog={this.handleCancelDialog}
                    />
                </>;
            case 'speechTask':
                return <SpeechTask
                    startSpeechTask={this.startSpeechTask}
                    endSpeechTask={this.endSpeechTask}
                    updateSpeechTaskFeedback={this.updateSpeechTaskFeedback}
                    studyResultId={this.data.studyMetaTracker.studyResultId}
                    markVideoAsUploading={this.markVideoAsUploading}
                    markVideoAsUploaded={this.markVideoAsUploaded}
                    language={this.data.studyMetaTracker.language}
                    handleCancelDialog={this.handleCancelDialog}
                    cancelDialogIsOpen={this.state.cancelDialogIsOpen}
                    areAllVideosUploaded={this.state.areAllVideosUploaded}
                    speechTestAnalysisCallback={this.speechTestAnalysisCallback}
                    studyID={this.data.studyMetaTracker.studyId}
                />;
            case 'endPage':
                return <>
                    <StepperWithLabels
                        slideSequences={this.state.slideSequences}
                        slideIndex={this.state.slideIndex}
                        studyPagesSequence={this.state.studyPagesSequence}
                        pageIndex={this.state.pageIndex}
                    />
                    <EndPage
                        activeSlide={this.state.slideSequences[this.state.studyPagesSequence[this.state.pageIndex]][this.state.slideIndex]}
                        handleNext={this.handleNext}
                        uploadFinalData={this.uploadFinalData}
                        handBackStressData={this.handBackStressData}
                        continueFromPanas={this.continueFromPanas}f
                        referenceTime={this.data.studyTimes.reference}
                        areAllVideosUploaded={this.state.areAllVideosUploaded}
                        studyMetaTracker={this.data.studyMetaTracker}
                        speechTestAnalysis={this.data.speechTestAnalysis}
                        handleCancelDialog={this.handleCancelDialog}
                    />
                </>;
            default:
                return null
        }
    }

    render() {
        return (
            <div className="App">
                <div className="container ">
                    <div className="row justify-content-md-center">
                        <div className="col text-center">
                            {this.renderCurrentComponent()}
                        </div>
                    </div>
                </div>
                {this.state.cancelDialogIsOpen
                    ? <CancelDialog
                        handleCancelDialog={this.handleCancelDialog}
                        cancelDialogIsOpen={this.state.cancelDialogIsOpen}
                        studyMetaTracker={this.data.studyMetaTracker}
                        areAllVideosUploaded={this.state.areAllVideosUploaded}
                        uploadFinalData={this.uploadFinalData}
                    />
                    : <div/>
                }
            </div>
        );
    }
}
export default Main;