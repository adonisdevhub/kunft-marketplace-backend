import * as fs from 'fs'
import nodemailer, { SentMessageInfo } from 'nodemailer'

import { NotificationSettings } from '@/types'

const MAIL_TRANSPORT = process.env.MAIL_TRANSPORT
const MAIL_FROM = process.env.MAIL_FROM

const emailTemplate = fs.readFileSync('./src/assets/emailtemplate.html', 'utf8')

export interface EmailDefinition {
  subject: string
  text: string
  html: {
    userName?: string
    message: string
    buttonText: string
    buttonUrl: string
  }
}

export interface EmailMessage {
  notificationKey: 'emailVerification'
  email: EmailDefinition
}

export interface SmsMessage {
  notificationKey: 'smsVerification' | 'shareAuction'
  smsMessage: string
}
export interface DualMessage {
  notificationKey: keyof NotificationSettings
  smsMessage: string
  email: EmailDefinition
}

export type Message = EmailMessage | SmsMessage | DualMessage

export default async function contactUser(user: any, message: Message) {
  // if (message.notificationKey === 'smsVerification') {
  //   return sendSMSToUser(user, message)
  // }
  if (message.notificationKey === 'emailVerification') {
    return sendEmail(user.email, user.id, message)
  }
}

export async function sendEmail(
  recipient: string,
  userId: string | null,
  message: EmailMessage | DualMessage,
) {
  if (!MAIL_FROM || !MAIL_TRANSPORT) return

  const nmTransporter = nodemailer.createTransport(MAIL_TRANSPORT)
  let emailHtml = emailTemplate
    .replace('{{message}}', message.email.html.message)
    .replace('{{buttonText}}', message.email.html.buttonText)
    .replace('{{buttonUrl}}', message.email.html.buttonUrl)
  if (message.email.html.userName) {
    emailHtml = emailHtml.replace('{{userName}}', message.email.html.userName)
  } else {
    emailHtml = emailHtml.replace('Hi {{userName}},', '')
  }
  nmTransporter.sendMail(
    {
      from: MAIL_FROM,
      to: recipient,
      subject: message.email.subject,
      text: message.email.text,
      html: emailHtml,
    },
    emailCallback,
  )
}

function emailCallback(err: Error | null, info: SentMessageInfo) {
  // TODO: save errors to DB
  if (err) return console.error('error sending email', err.message)
}
