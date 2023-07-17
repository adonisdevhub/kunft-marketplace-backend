export interface NotificationMethods {
  email: boolean
  mobile: boolean
}
export interface NotificationSettings {
  onAcceptOffer: NotificationMethods
  onBuy: NotificationMethods
  onOfferd: NotificationMethods
}
