import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Transporter } from 'nodemailer';

// Mock the config module
vi.mock('../../config/env', () => ({
  config: {
    MAIL_HOST: 'smtp.example.com',
    MAIL_PORT: 587,
    MAIL_USER: 'user@example.com',
    MAIL_PASS: 'password',
    MAIL_FROM: 'no-reply@example.com',
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sendMail', () => {
  let sendMailMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-id' });

    const fakeTransporter = {
      sendMail: sendMailMock,
    } as unknown as Transporter;

    // Inject the fake transporter before each test
    const { _setTransporter } = await import('../../utils/mail.util');
    _setTransporter(fakeTransporter);
  });

  afterEach(async () => {
    const { _resetTransporter } = await import('../../utils/mail.util');
    _resetTransporter();
    vi.clearAllMocks();
  });

  it('calls transporter.sendMail with the correct parameters', async () => {
    const { sendMail } = await import('../../utils/mail.util');

    await sendMail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(sendMailMock).toHaveBeenCalledOnce();
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
  });

  it('uses MAIL_FROM as the sender address', async () => {
    const { sendMail } = await import('../../utils/mail.util');

    await sendMail({
      to: 'someone@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    const callArgs = sendMailMock.mock.calls[0][0];
    expect(callArgs.from).toBe('no-reply@example.com');
  });

  it('throws an Error with the SMTP message when delivery fails', async () => {
    const smtpError = new Error('Connection refused by SMTP server');
    sendMailMock.mockRejectedValueOnce(smtpError);

    const { sendMail } = await import('../../utils/mail.util');

    await expect(
      sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })
    ).rejects.toThrow('Connection refused by SMTP server');
  });

  it('wraps the SMTP error in a descriptive message', async () => {
    const smtpError = new Error('Authentication failed');
    sendMailMock.mockRejectedValueOnce(smtpError);

    const { sendMail } = await import('../../utils/mail.util');

    await expect(
      sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })
    ).rejects.toThrow(expect.objectContaining({ message: expect.stringContaining('Authentication failed') }));
  });
});
