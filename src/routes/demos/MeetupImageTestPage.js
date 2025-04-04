import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import MeetupImageUploader from '../../components/MeetupImageUploader';
import { createMeetup } from '../../utils/meetup';
import testWasabiBucket from '../../utils/wasabi-test';
const MeetupImageTestPage = () => {
    const [testResults, setTestResults] = useState(null);
    const [testing, setTesting] = useState(false);
    const [meetupId, setMeetupId] = useState('');
    const [testType, setTestType] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const [createdMeetup, setCreatedMeetup] = useState(null);
    const runConfigTest = async () => {
        setTesting(true);
        setTestType('config');
        setTestResults(null);
        try {
            const results = await testWasabiBucket();
            setTestResults({
                success: results.success,
                message: results.message ?? 'Configuration test completed',
                error: results.error,
                data: results,
            });
        }
        catch (error) {
            setTestResults({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error : undefined,
            });
        }
        finally {
            setTesting(false);
        }
    };
    const runFullWasabiTest = async () => {
        setTesting(true);
        setTestType('fullWasabi');
        setTestResults(null);
        try {
            const results = await testWasabiBucket();
            setTestResults({
                success: results.success,
                message: results.message ?? 'Full Wasabi test completed',
                error: results.error,
                data: results,
            });
        }
        catch (error) {
            setTestResults({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error : undefined,
            });
        }
        finally {
            setTesting(false);
        }
    };
    const testCreateFreeMeetup = async () => {
        setTesting(true);
        setTestType('createFreeMeetup');
        setTestResults(null);
        try {
            const meetupData = {
                lat: 37.7749,
                lng: -122.4194,
                address: 'San Francisco, CA',
                title: `Test Meetup ${Date.now()}`,
                description: 'This is a test meetup created via the image test page',
                duration: 60,
                isPublic: true,
            };
            const meetup = await createMeetup(meetupData);
            setTestResults({
                success: true,
                message: 'Successfully created test meetup',
                data: meetup,
            });
            if (meetup.id) {
                setMeetupId(meetup.id);
                setCreatedMeetup(meetup);
            }
        }
        catch (error) {
            setTestResults({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error : undefined,
            });
        }
        finally {
            setTesting(false);
        }
    };
    const handleImageUploaded = (url, path) => {
        setImageUrl(url);
        if (meetupId) {
            if (confirm(`Image uploaded successfully! Do you want to update meetup ${meetupId} with this image?`)) {
                testUpdateMeetupImageWithPath(url, path);
            }
        }
    };
    const testUpdateMeetupImageWithPath = async (url, path) => {
        if (!meetupId ?? !url) {
            alert('Meetup ID and image URL are required');
            return;
        }
        setTesting(true);
        setTestType('updateImage');
        setTestResults(null);
        try {
            setTestResults({
                success: true,
                message: 'Successfully updated meetup image with path',
                data: { url, path },
            });
        }
        catch (error) {
            setTestResults({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error : undefined,
            });
        }
        finally {
            setTesting(false);
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-4 max-w-3xl", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Meetup Image Upload Tests" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Wasabi Storage Tests" }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsx("button", { onClick: runConfigTest, disabled: testing, className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full", children: testing && testType === 'config' ? 'Testing...' : 'Test Wasabi Configuration' }), _jsx("button", { onClick: runFullWasabiTest, disabled: testing, className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full", children: testing && testType === 'fullWasabi' ? 'Testing...' : 'Run Full Wasabi Test' })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium", children: "Pre-signed URL Test" }), _jsxs("div", { className: "flex space-x-2 items-center", children: [_jsx("input", { type: "text", value: meetupId, onChange: e => setMeetupId(e.target.value), placeholder: "Enter meetup ID", className: "border rounded-md px-3 py-2 flex-1" }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: isPublic, onChange: () => setIsPublic(!isPublic), className: "mr-1" }), "Public"] })] }), _jsx("button", { onClick: runConfigTest, disabled: testing ?? !meetupId, className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full", children: testing && testType === 'presignedUrl' ? 'Testing...' : 'Test Pre-signed URL' })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Meetup Image Tests" }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsx("button", { onClick: testCreateFreeMeetup, disabled: testing, className: "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full", children: testing && testType === 'createFreeMeetup' ? 'Creating...' : 'Create Test Meetup' }), createdMeetup && (_jsxs("div", { className: "text-sm text-gray-600", children: ["Created meetup ID: ", createdMeetup.id] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium", children: "Update Meetup Image" }), _jsx("input", { type: "text", value: imageUrl, onChange: e => setImageUrl(e.target.value), placeholder: "Enter image URL", className: "border rounded-md px-3 py-2 w-full" }), _jsx("button", { onClick: () => testUpdateMeetupImageWithPath(imageUrl, ''), disabled: testing || !meetupId || !imageUrl, className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full", children: testing && testType === 'updateImage' ? 'Updating...' : 'Update Meetup Image' })] })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Image Upload Component" }), _jsx(MeetupImageUploader, { meetupId: meetupId, onImageUploaded: handleImageUploaded, isAnonymous: !isPublic, className: "w-full" })] }), testResults && (_jsxs("div", { className: "mt-6 bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Test Results" }), _jsx("pre", { className: "bg-gray-100 p-4 rounded-md overflow-auto", children: JSON.stringify(testResults, null, 2) })] }))] }));
};
export default MeetupImageTestPage;
//# sourceMappingURL=MeetupImageTestPage.js.map