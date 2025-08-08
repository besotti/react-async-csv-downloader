import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useDownloadLink } from './useDownloadLink';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const TestComponent = ({ asyncResolver, onStart, onSuccess, onError }: any) => {
    const { getProps } = useDownloadLink({
        asyncResolver,
        onStart,
        onSuccess,
        onError,
    });
    const { linkRef, ...rest } = getProps();

    return (
        <a ref={linkRef} {...rest}>
            Download
        </a>
    );
};

describe('useDownloadLink', () => {
    const mockAsyncResolver = vi.fn();
    const mockOnStart = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Set up a Blob constructor mock if needed
        global.Blob = vi.fn().mockImplementation((content) => {
            return { content };
        });
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
        global.URL.revokeObjectURL = vi.fn();
    });

    it('should call onStart and onSuccess when the link is clicked and resolves successfully', async () => {
        const csvData = { file: 'sample,data', type: 'text/csv' };
        mockAsyncResolver.mockResolvedValueOnce(csvData);

        const { getByText } = render(
            <TestComponent asyncResolver={mockAsyncResolver} onStart={mockOnStart} onSuccess={mockOnSuccess} />,
        );

        // Simulate click
        const link = getByText('Download');
        await fireEvent.click(link);

        expect(mockOnStart).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        expect(mockAsyncResolver).toHaveBeenCalledTimes(1);

        // Verify link download behavior
        const createdLink = document.body.querySelector('a');
        expect(createdLink).toBeTruthy();
        expect(createdLink?.download).toBe('');
        expect(global.URL.createObjectURL).toHaveBeenCalledWith({ content: ['sample,data'] });
        expect(createdLink?.href).toBe('');
    });

    it('should call onError when the asyncResolver throws an error', async () => {
        const errorMessage = 'Error occurred';
        mockAsyncResolver.mockRejectedValueOnce(new Error(errorMessage));

        const { getByText } = render(
            <TestComponent asyncResolver={mockAsyncResolver} onStart={mockOnStart} onError={mockOnError} />,
        );

        // Simulate click
        const link = getByText('Download');
        await fireEvent.click(link);

        expect(mockOnStart).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith(new Error(errorMessage));
        expect(mockAsyncResolver).toHaveBeenCalledTimes(1);
    });

    it('should create a temporary link and trigger download', async () => {
        const csvData = { file: 'sample,data', type: 'text/csv' };
        mockAsyncResolver.mockResolvedValueOnce(csvData);

        const { getByText } = render(<TestComponent asyncResolver={mockAsyncResolver} />);

        // Simulate click
        const link = getByText('Download');
        await fireEvent.click(link);

        // Verify the link is clicked and cleaned up
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
        expect(global.URL.createObjectURL).toHaveBeenCalled();

        // Check if a link is created
        const createdLink = document.body.querySelector('a');
        expect(createdLink).toBeTruthy();
        expect(createdLink?.download).toBe('');

        // Clean up the created link
        document.body.innerHTML = ''; // Clear the body after the test
    });
});
