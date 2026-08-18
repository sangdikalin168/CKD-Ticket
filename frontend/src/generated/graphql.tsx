import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
};

export enum AccessMethod {
  Code = 'CODE',
  Fingerprint = 'FINGERPRINT',
  Manual = 'MANUAL',
  Rfid = 'RFID'
}

export enum AccessModel {
  Count = 'COUNT',
  Time = 'TIME'
}

export type ActiveCustomerReport = {
  __typename?: 'ActiveCustomerReport';
  customers: Array<Customer>;
  total: Scalars['Int'];
};

/** Kid or Adult. */
export enum AgeGroup {
  Adult = 'Adult',
  Kid = 'Kid'
}

export enum ApprovalStatus {
  Approved = 'Approved',
  Pending = 'Pending',
  Rejected = 'Rejected'
}

export type CheckIn = {
  __typename?: 'CheckIn';
  access_method: AccessMethod;
  check_in_id: Scalars['Float'];
  check_in_time: Scalars['String'];
  customer_id?: Maybe<Scalars['Float']>;
  entitlement_id?: Maybe<Scalars['Float']>;
  facility_id?: Maybe<Scalars['Float']>;
  key_taken: Scalars['Boolean'];
  note?: Maybe<Scalars['String']>;
  recorded_by?: Maybe<Scalars['Float']>;
  towel_taken: Scalars['Boolean'];
};

export type CheckinCoupon = {
  __typename?: 'CheckinCoupon';
  coupon_code: Scalars['String'];
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  gender: Scalars['String'];
  phone: Scalars['String'];
  price: Scalars['Float'];
  quantity: Scalars['Int'];
};

export type CheckinFingerprint = {
  __typename?: 'CheckinFingerprint';
  customer_id: Scalars['Float'];
  fingerprint: Scalars['String'];
};

export type CheckinMember = {
  __typename?: 'CheckinMember';
  active: Scalars['Boolean'];
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  gender: Scalars['String'];
  key_status: Scalars['String'];
  next_payment: Scalars['String'];
  phone: Scalars['String'];
  shift: Scalars['String'];
  towel_status: Scalars['String'];
};

export type CheckinResponse = {
  __typename?: 'CheckinResponse';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type CheckinTicket = {
  __typename?: 'CheckinTicket';
  entries_left?: Maybe<Scalars['Int']>;
  is_check: Scalars['Int'];
  key_image?: Maybe<Scalars['String']>;
  key_label?: Maybe<Scalars['String']>;
  place_allowed: Scalars['Boolean'];
  place_names: Array<Scalars['String']>;
  places: Array<Scalars['String']>;
  price: Scalars['Float'];
  station_place: Scalars['String'];
  status?: Maybe<Scalars['String']>;
  ticket_code: Scalars['String'];
};

export type CheckoutMember = {
  __typename?: 'CheckoutMember';
  check_in_id?: Maybe<Scalars['Float']>;
  check_in_time?: Maybe<Scalars['String']>;
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  image_path?: Maybe<Scalars['String']>;
  key_taken: Scalars['Boolean'];
  phone?: Maybe<Scalars['String']>;
  towel_taken: Scalars['Boolean'];
};

export type CouponCard = {
  __typename?: 'CouponCard';
  card_name: Scalars['String'];
  coupon_code: Scalars['String'];
  created_date: Scalars['String'];
  id: Scalars['Float'];
  price: Scalars['Float'];
  quantity: Scalars['Float'];
  status: Scalars['String'];
};

export type CouponPayment = {
  __typename?: 'CouponPayment';
  card_name: Scalars['String'];
  coupon_code: Scalars['String'];
  customer_id: Scalars['Float'];
  key_qty: Scalars['Float'];
  last_update: Scalars['String'];
  payment_date: Scalars['String'];
  payment_id: Scalars['Float'];
  price: Scalars['Float'];
  quantity: Scalars['Float'];
  towel_qty: Scalars['Float'];
  user_id: Scalars['Float'];
};

export type CouponPaymentMutationResponse = {
  __typename?: 'CouponPaymentMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  payment_id: Scalars['Float'];
  success: Scalars['Boolean'];
};

export type CouponType = {
  __typename?: 'CouponType';
  card_name: Scalars['String'];
  customer_name: Scalars['String'];
  price: Scalars['Float'];
  qty: Scalars['Float'];
};

export type Customer = {
  __typename?: 'Customer';
  created_by: Scalars['Float'];
  created_date: Scalars['String'];
  customer_code: Scalars['String'];
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  date_of_birth?: Maybe<Scalars['String']>;
  end_fruit_date: Scalars['String'];
  end_membership_date: Scalars['String'];
  fingerprint: Scalars['String'];
  gender: Scalars['String'];
  image_path?: Maybe<Scalars['String']>;
  key_status: Scalars['String'];
  phone: Scalars['String'];
  rfid_uid?: Maybe<Scalars['String']>;
  shift: Scalars['String'];
  status: CustomerStatus;
  towel_status: Scalars['String'];
};

export type CustomerMembershipDetail = {
  __typename?: 'CustomerMembershipDetail';
  customer_code: Scalars['String'];
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  end_membership_date: Scalars['String'];
  gender: Scalars['String'];
  month_qty: Scalars['Float'];
  payment_date: Scalars['DateTime'];
  phone: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
};

export type CustomerMutationResponse = {
  __typename?: 'CustomerMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type CustomerScanReport = {
  __typename?: 'CustomerScanReport';
  FromDate: Scalars['String'];
  ScanLog: Array<ScanLog>;
  ToDate: Scalars['String'];
  member_id: Scalars['Float'];
};

export enum CustomerStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

/** Full, Old, or New member. */
export enum CustomerType {
  Full = 'Full',
  New = 'New',
  Old = 'Old'
}

export type CustomersByMembershipDurationReport = {
  __typename?: 'CustomersByMembershipDurationReport';
  groups: Array<MembershipDurationGroup>;
  total_all_customers: Scalars['Int'];
  total_all_revenue: Scalars['Float'];
};

export type Entitlement = {
  __typename?: 'Entitlement';
  access_code?: Maybe<Scalars['String']>;
  access_model: AccessModel;
  created_at: Scalars['String'];
  customer_id?: Maybe<Scalars['Float']>;
  entitlement_id: Scalars['Float'];
  entries_total?: Maybe<Scalars['Float']>;
  entries_used: Scalars['Float'];
  origin_purchase_id?: Maybe<Scalars['Float']>;
  package_id: Scalars['Float'];
  product_type: ProductType;
  shift: Shift;
  status: EntitlementStatus;
  valid_from?: Maybe<Scalars['String']>;
  valid_until?: Maybe<Scalars['String']>;
};

export enum EntitlementStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  OnHold = 'ON_HOLD',
  Transferred = 'TRANSFERRED',
  UsedUp = 'USED_UP'
}

export type ExpiringCustomerReport = {
  __typename?: 'ExpiringCustomerReport';
  customers: Array<Customer>;
  total: Scalars['Int'];
};

export type Facility = {
  __typename?: 'Facility';
  code: Scalars['String'];
  facility_id: Scalars['Float'];
  name: Scalars['String'];
  requires_door_access: Scalars['Boolean'];
};

export type FruitPayment = {
  __typename?: 'FruitPayment';
  customer_id: Scalars['Float'];
  month_qty: Scalars['Float'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  payment_date: Scalars['DateTime'];
  payment_id: Scalars['Float'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  user_id: Scalars['Float'];
};

export type FruitPaymentMutationResponse = {
  __typename?: 'FruitPaymentMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  payment_id: Scalars['Float'];
  success: Scalars['Boolean'];
};

export type FruitPrice = {
  __typename?: 'FruitPrice';
  age: Scalars['String'];
  id: Scalars['Float'];
  month_qty: Scalars['Float'];
  name: Scalars['String'];
  price: Scalars['Float'];
};

export type GetUser = {
  __typename?: 'GetUser';
  branch: Scalars['String'];
  display_name: Scalars['String'];
  role: Scalars['String'];
  user_id: Scalars['ID'];
};

export type Hold = {
  __typename?: 'Hold';
  fee: Scalars['Float'];
  hold_date: Scalars['String'];
  hold_id: Scalars['Float'];
  request_id: Scalars['Float'];
};

export type HoldJoin = {
  __typename?: 'HoldJoin';
  approved_by: Scalars['Float'];
  approved_date: Scalars['String'];
  approved_name?: Maybe<Scalars['String']>;
  approver_comment: Scalars['String'];
  approver_status: Scalars['String'];
  checked_by: Scalars['Float'];
  checked_date: Scalars['String'];
  checker_comment: Scalars['String'];
  checker_name?: Maybe<Scalars['String']>;
  checker_status: Scalars['String'];
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  display_name: Scalars['String'];
  from_date: Scalars['String'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  phone: Scalars['String'];
  process: Scalars['String'];
  processed_by: Scalars['Float'];
  processed_name?: Maybe<Scalars['String']>;
  reason: Scalars['String'];
  request_by: Scalars['Float'];
  request_date: Scalars['String'];
  request_id: Scalars['Float'];
  to_date: Scalars['String'];
};

export type HoldMutationResponse = HoldResponse & {
  __typename?: 'HoldMutationResponse';
  code: Scalars['Float'];
  hold_id?: Maybe<Scalars['Float']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type HoldRequest = {
  __typename?: 'HoldRequest';
  approved_by: Scalars['Float'];
  approved_date: Scalars['String'];
  approver_comment: Scalars['String'];
  approver_status: Scalars['String'];
  checked_by: Scalars['Float'];
  checked_date: Scalars['String'];
  checker_comment: Scalars['String'];
  checker_status: Scalars['String'];
  customer_id: Scalars['Float'];
  from_date: Scalars['String'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  process: Scalars['String'];
  processed_by: Scalars['Float'];
  reason: Scalars['String'];
  request_by: Scalars['Float'];
  request_date: Scalars['String'];
  request_id: Scalars['Float'];
  to_date: Scalars['String'];
};

export type HoldRequestV2 = {
  __typename?: 'HoldRequestV2';
  customer_id: Scalars['Float'];
  decided_at?: Maybe<Scalars['String']>;
  decided_by?: Maybe<Scalars['Float']>;
  decision_note?: Maybe<Scalars['String']>;
  fee: Scalars['String'];
  from_date: Scalars['String'];
  legacy: Scalars['Float'];
  new_end?: Maybe<Scalars['String']>;
  old_end?: Maybe<Scalars['String']>;
  processed_at?: Maybe<Scalars['String']>;
  processed_by?: Maybe<Scalars['Float']>;
  reason: Scalars['String'];
  request_id: Scalars['Float'];
  requested_at: Scalars['String'];
  requested_by: Scalars['Float'];
  status: Scalars['String'];
  to_date: Scalars['String'];
};

export type HoldRequestV2Row = {
  __typename?: 'HoldRequestV2Row';
  customer_id: Scalars['Float'];
  customer_name: Scalars['String'];
  decided_at?: Maybe<Scalars['String']>;
  decided_by?: Maybe<Scalars['Float']>;
  decided_by_name?: Maybe<Scalars['String']>;
  decision_note?: Maybe<Scalars['String']>;
  fee: Scalars['String'];
  from_date: Scalars['String'];
  legacy: Scalars['Float'];
  new_end?: Maybe<Scalars['String']>;
  old_end?: Maybe<Scalars['String']>;
  phone: Scalars['String'];
  processed_at?: Maybe<Scalars['String']>;
  processed_by?: Maybe<Scalars['Float']>;
  processed_by_name?: Maybe<Scalars['String']>;
  reason: Scalars['String'];
  request_id: Scalars['Float'];
  requested_at: Scalars['String'];
  requested_by: Scalars['Float'];
  requested_by_name?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  to_date: Scalars['String'];
};

export type HoldResponse = {
  code: Scalars['Float'];
  hold_id?: Maybe<Scalars['Float']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type HoldV2Response = {
  __typename?: 'HoldV2Response';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  new_end?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type IMutationResponse = {
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type LoginInput = {
  password: Scalars['String'];
  username: Scalars['String'];
};

export type MemberPayment = {
  __typename?: 'MemberPayment';
  customer_id: Scalars['Float'];
  month_qty: Scalars['Float'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  payment_date: Scalars['DateTime'];
  payment_id: Scalars['Float'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  shift: Scalars['String'];
  start_date: Scalars['String'];
  user_id: Scalars['Float'];
};

export type MemberPaymentDetail = {
  __typename?: 'MemberPaymentDetail';
  customer_name: Scalars['String'];
  display_name: Scalars['String'];
  new_end: Scalars['DateTime'];
  old_end: Scalars['DateTime'];
  payment_date: Scalars['DateTime'];
  payment_id: Scalars['Float'];
  phone: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  start_date: Scalars['DateTime'];
};

export type MemberPaymentMutationResponse = {
  __typename?: 'MemberPaymentMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  payment_id: Scalars['Float'];
  success: Scalars['Boolean'];
};

export type MemberPriceTable = {
  __typename?: 'MemberPriceTable';
  ageGroup: AgeGroup;
  customerType: CustomerType;
  description: Scalars['String'];
  entryQty: Scalars['Float'];
  facilities: Array<Facility>;
  id: Scalars['Float'];
  key_image?: Maybe<Scalars['String']>;
  monthQty: Scalars['Float'];
  price: Scalars['Float'];
  serviceType: ServiceType;
  shift: ShiftType;
};

export type MemberScan = {
  __typename?: 'MemberScan';
  date_time: Scalars['String'];
  id: Scalars['Float'];
  member_id: Scalars['Float'];
};

export type MemberType = {
  __typename?: 'MemberType';
  customer_name: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  qty: Scalars['Float'];
};

export type MembershipDurationGroup = {
  __typename?: 'MembershipDurationGroup';
  customers: Array<CustomerMembershipDetail>;
  month_duration: Scalars['Int'];
  total_customers: Scalars['Int'];
  total_revenue: Scalars['Float'];
};

export type Mutation = {
  __typename?: 'Mutation';
  ApproveHoldRequest: HoldMutationResponse;
  ApproveTransferRequest: TransferMutationResponse;
  CancelHoldRequestV2: HoldV2Response;
  CheckHoldRequest: HoldMutationResponse;
  CheckTransferRequest: TransferMutationResponse;
  CreateCouponPayment: CouponPaymentMutationResponse;
  CreateCustomer: CustomerMutationResponse;
  CreateCustomerPayment: MemberPaymentMutationResponse;
  CreateFruitPayment: FruitPaymentMutationResponse;
  CreateHold: HoldMutationResponse;
  CreateHoldRequest: HoldMutationResponse;
  CreateHoldRequestV2: HoldV2Response;
  CreateTicketPayment: TicketPaymentMutationResponse;
  CreateTrainningPayment: TrainningPaymentMutationResponse;
  CreateTransfer: TransferMutationResponse;
  CreateTransferRequest: TransferMutationResponse;
  DecideHoldRequestV2: HoldV2Response;
  DeleteTicketPriceConfig: Scalars['Boolean'];
  ProcessHoldV2: HoldV2Response;
  UpdateCustomer: CustomerMutationResponse;
  UpdateCustomerPhoto: CustomerMutationResponse;
  UpsertTicketPriceConfig: TicketPriceConfig;
  checkinConsumeCoupon: CheckinResponse;
  checkinMember: CheckinResponse;
  checkinSaveFingerprint: CheckinResponse;
  checkinTicket: CheckinResponse;
  checkoutUpdateItems: CheckinResponse;
  createMemberPrice: MemberPriceTable;
  create_user: UserMutationResponse;
  deleteMemberPrice: Scalars['Boolean'];
  enqueuePrintJob: PrintJobResponse;
  login: UserMutationResponse;
  logout: UserMutationResponse;
  printSelfTest: PrintJobResponse;
  updatePrice?: Maybe<MemberPriceTable>;
};


export type MutationApproveHoldRequestArgs = {
  approved_by: Scalars['Float'];
  approver_comment: Scalars['String'];
  approver_status: Scalars['String'];
  request_id: Scalars['Float'];
};


export type MutationApproveTransferRequestArgs = {
  approver_comment: Scalars['String'];
  approver_status: ApprovalStatus;
  request_id: Scalars['Float'];
};


export type MutationCancelHoldRequestV2Args = {
  request_id: Scalars['Float'];
};


export type MutationCheckHoldRequestArgs = {
  checked_by: Scalars['Float'];
  checker_comment: Scalars['String'];
  checker_status: Scalars['String'];
  request_id: Scalars['Float'];
};


export type MutationCheckTransferRequestArgs = {
  checker_comment: Scalars['String'];
  checker_status: ApprovalStatus;
  request_id: Scalars['Float'];
};


export type MutationCreateCouponPaymentArgs = {
  card_name: Scalars['String'];
  coupon_code: Scalars['String'];
  customer_id: Scalars['Float'];
  price: Scalars['Float'];
  quantity: Scalars['Float'];
  user_id: Scalars['Float'];
};


export type MutationCreateCustomerArgs = {
  created_by: Scalars['Float'];
  customer_name: Scalars['String'];
  gender: Scalars['String'];
  phone: Scalars['String'];
};


export type MutationCreateCustomerPaymentArgs = {
  customer_id: Scalars['Float'];
  month_qty: Scalars['Float'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  shift: Scalars['String'];
  start_date: Scalars['String'];
  user_id: Scalars['Float'];
};


export type MutationCreateFruitPaymentArgs = {
  customer_id: Scalars['Float'];
  month_qty: Scalars['Float'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  user_id: Scalars['Float'];
};


export type MutationCreateHoldArgs = {
  customer_id: Scalars['Float'];
  new_end: Scalars['String'];
  processed_by: Scalars['Float'];
  request_id: Scalars['Float'];
};


export type MutationCreateHoldRequestArgs = {
  customer_id: Scalars['Float'];
  from_date: Scalars['String'];
  new_end: Scalars['String'];
  old_end: Scalars['String'];
  reason: Scalars['String'];
  request_by: Scalars['Float'];
  to_date: Scalars['String'];
};


export type MutationCreateHoldRequestV2Args = {
  customer_id: Scalars['Float'];
  from_date: Scalars['String'];
  reason: Scalars['String'];
  to_date: Scalars['String'];
};


export type MutationCreateTicketPaymentArgs = {
  price: Scalars['Float'];
  ticket_code: Scalars['String'];
  user_id: Scalars['Float'];
};


export type MutationCreateTrainningPaymentArgs = {
  customer_id: Scalars['Float'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  type: Scalars['String'];
  user_id: Scalars['Float'];
};


export type MutationCreateTransferArgs = {
  fee?: InputMaybe<Scalars['Float']>;
  request_id: Scalars['Float'];
};


export type MutationCreateTransferRequestArgs = {
  reason: Scalars['String'];
  receiver_id: Scalars['Float'];
  sender_id: Scalars['Float'];
};


export type MutationDecideHoldRequestV2Args = {
  approve: Scalars['Boolean'];
  note?: InputMaybe<Scalars['String']>;
  request_id: Scalars['Float'];
};


export type MutationDeleteTicketPriceConfigArgs = {
  config_id: Scalars['Float'];
};


export type MutationProcessHoldV2Args = {
  fee?: InputMaybe<Scalars['Float']>;
  request_id: Scalars['Float'];
};


export type MutationUpdateCustomerArgs = {
  customer_id: Scalars['Float'];
  phone: Scalars['String'];
};


export type MutationUpdateCustomerPhotoArgs = {
  customer_id: Scalars['Float'];
  image_path: Scalars['String'];
};


export type MutationUpsertTicketPriceConfigArgs = {
  age_group?: InputMaybe<Scalars['String']>;
  facility_ids: Array<Scalars['Float']>;
  key_image?: InputMaybe<Scalars['String']>;
  label?: InputMaybe<Scalars['String']>;
  price: Scalars['Float'];
};


export type MutationCheckinConsumeCouponArgs = {
  coupon_code: Scalars['String'];
  key_qty?: InputMaybe<Scalars['Int']>;
  towel_qty?: InputMaybe<Scalars['Int']>;
};


export type MutationCheckinMemberArgs = {
  customer_id: Scalars['Float'];
  key_status: Scalars['String'];
  towel_status: Scalars['String'];
};


export type MutationCheckinSaveFingerprintArgs = {
  customer_id: Scalars['Float'];
  template: Scalars['String'];
};


export type MutationCheckinTicketArgs = {
  station_place?: InputMaybe<Scalars['String']>;
  ticket_code: Scalars['String'];
};


export type MutationCheckoutUpdateItemsArgs = {
  check_in_id: Scalars['Int'];
  key_taken?: InputMaybe<Scalars['Boolean']>;
  towel_taken?: InputMaybe<Scalars['Boolean']>;
};


export type MutationCreateMemberPriceArgs = {
  ageGroup: Scalars['String'];
  customerType: Scalars['String'];
  description: Scalars['String'];
  entryQty?: InputMaybe<Scalars['Float']>;
  facility_ids?: InputMaybe<Array<Scalars['Int']>>;
  key_image?: InputMaybe<Scalars['String']>;
  monthQty?: InputMaybe<Scalars['Float']>;
  price: Scalars['Float'];
  shift?: InputMaybe<Scalars['String']>;
};


export type MutationCreate_UserArgs = {
  userInput: RegisterInput;
};


export type MutationDeleteMemberPriceArgs = {
  id: Scalars['Float'];
};


export type MutationEnqueuePrintJobArgs = {
  input: PrintJobInput;
};


export type MutationLoginArgs = {
  loginInput: LoginInput;
};


export type MutationLogoutArgs = {
  user_id?: InputMaybe<Scalars['ID']>;
};


export type MutationUpdatePriceArgs = {
  ageGroup?: InputMaybe<Scalars['String']>;
  customerType?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  entryQty?: InputMaybe<Scalars['Float']>;
  facility_ids?: InputMaybe<Array<Scalars['Int']>>;
  id: Scalars['Int'];
  key_image?: InputMaybe<Scalars['String']>;
  monthQty?: InputMaybe<Scalars['Float']>;
  price?: InputMaybe<Scalars['Float']>;
  shift?: InputMaybe<Scalars['String']>;
};

export type Package = {
  __typename?: 'Package';
  access_model: AccessModel;
  created_at: Scalars['String'];
  duration_months?: Maybe<Scalars['Float']>;
  entry_count?: Maybe<Scalars['Float']>;
  grants_door_access: Scalars['Boolean'];
  is_active: Scalars['Boolean'];
  name: Scalars['String'];
  package_id: Scalars['Float'];
  price: Scalars['Float'];
  product_type: ProductType;
};

export type PackageFacility = {
  __typename?: 'PackageFacility';
  facility_id: Scalars['Float'];
  id: Scalars['Float'];
  package_id: Scalars['Float'];
};

export enum PaymentMethod {
  Card = 'CARD',
  Cash = 'CASH',
  Other = 'OTHER',
  Transfer = 'TRANSFER'
}

export enum PrintDocType {
  Coupon = 'COUPON',
  Fruit = 'FRUIT',
  Hold = 'HOLD',
  MemberPayment = 'MEMBER_PAYMENT',
  MemberRenew = 'MEMBER_RENEW',
  SelfTest = 'SELF_TEST',
  TicketSale = 'TICKET_SALE',
  Training = 'TRAINING',
  Transfer = 'TRANSFER'
}

export type PrintJob = {
  __typename?: 'PrintJob';
  attempts: Scalars['Float'];
  copies: Scalars['Float'];
  created_at: Scalars['DateTime'];
  doc_type: PrintDocType;
  idempotency_key: Scalars['String'];
  job_id: Scalars['ID'];
  last_error?: Maybe<Scalars['String']>;
  max_attempts: Scalars['Float'];
  ref_id: Scalars['Float'];
  status: PrintJobStatus;
};

export type PrintJobInput = {
  copies?: InputMaybe<Scalars['Int']>;
  doc_type: PrintDocType;
  idempotency_key?: InputMaybe<Scalars['String']>;
  ref_id?: InputMaybe<Scalars['Int']>;
};

export type PrintJobResponse = {
  __typename?: 'PrintJobResponse';
  duplicate: Scalars['Boolean'];
  job_id?: Maybe<Scalars['ID']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export enum PrintJobStatus {
  Cancelled = 'CANCELLED',
  Done = 'DONE',
  Failed = 'FAILED',
  Printing = 'PRINTING',
  Queued = 'QUEUED'
}

export type PrinterStatus = {
  __typename?: 'PrinterStatus';
  failed: Scalars['Int'];
  queued: Scalars['Int'];
  worker_available: Scalars['Boolean'];
  worker_error?: Maybe<Scalars['String']>;
};

export enum ProcessStatus {
  Done = 'Done',
  Pending = 'Pending'
}

export enum ProductType {
  Coupon = 'COUPON',
  Fruit = 'FRUIT',
  Membership = 'MEMBERSHIP',
  Ticket = 'TICKET',
  Training = 'TRAINING'
}

export type Purchase = {
  __typename?: 'Purchase';
  applies_from?: Maybe<Scalars['String']>;
  applies_until?: Maybe<Scalars['String']>;
  customer_id?: Maybe<Scalars['Float']>;
  discount_amount: Scalars['Float'];
  entitlement_id?: Maybe<Scalars['Float']>;
  entries_added?: Maybe<Scalars['Float']>;
  note?: Maybe<Scalars['String']>;
  package_id: Scalars['Float'];
  payment_method?: Maybe<PaymentMethod>;
  previous_valid_until?: Maybe<Scalars['String']>;
  price_paid: Scalars['Float'];
  promotion?: Maybe<Scalars['String']>;
  purchase_date: Scalars['String'];
  purchase_id: Scalars['Float'];
  shift?: Maybe<Shift>;
  sold_by: Scalars['Float'];
};

export type Query = {
  __typename?: 'Query';
  GetActiveHoldRequestV2: Array<HoldRequestV2>;
  GetCouponCard: Array<CouponCard>;
  GetCouponPayment: Array<CouponPayment>;
  GetCouponPaymentDetails: Array<CouponType>;
  GetCouponPayments: Array<CouponType>;
  GetCustomerDetail: Array<Customer>;
  GetCustomers: Array<Customer>;
  GetCustomersCount: Scalars['Int'];
  GetFruitPayment: Array<FruitPayment>;
  GetFruitPriceTable: Array<FruitPrice>;
  GetHoldRequest: Array<HoldRequest>;
  GetHoldRequestByStatus: Array<HoldRequest>;
  GetMemberPayment: Array<MemberPayment>;
  GetMemberPaymentDetail: Array<MemberType>;
  GetMemberPayments: Array<MemberType>;
  GetSeller: Array<Users>;
  GetTicketPayment: Array<TicketType>;
  GetTicketPriceConfigs: Array<TicketPriceConfig>;
  GetTrainningPayment: Array<TrainningPayment>;
  GetTrainningPaymentDetail: Array<MemberType>;
  GetTrainningPayments: Array<TrainningType>;
  GetTranningPrice: Array<TrainningPrice>;
  HoldRequests: Array<HoldJoin>;
  HoldRequestsV2: Array<HoldRequestV2Row>;
  MemberPaymentDetail: MemberPaymentDetail;
  TransferRequests: Array<TransferJoin>;
  activeCustomers: ActiveCustomerReport;
  checkinFingerprints: Array<CheckinFingerprint>;
  checkinLookupCoupon?: Maybe<CheckinCoupon>;
  checkinLookupMember?: Maybe<CheckinMember>;
  checkinLookupTicket?: Maybe<CheckinTicket>;
  checkoutLookupMember?: Maybe<CheckoutMember>;
  customerScanReport: CustomerScanReport;
  customersByMembershipDuration: CustomersByMembershipDurationReport;
  expiringCustomersOnDate: ExpiringCustomerReport;
  facilities: Array<Facility>;
  getAllMemberPriceTable: Array<MemberPriceTable>;
  getMemberPriceById?: Maybe<MemberPriceTable>;
  get_user: GetUser;
  printerStatus: PrinterStatus;
  users: Array<Users>;
};


export type QueryGetActiveHoldRequestV2Args = {
  customer_id: Scalars['Float'];
};


export type QueryGetCouponCardArgs = {
  coupon_code: Scalars['String'];
};


export type QueryGetCouponPaymentArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetCouponPaymentDetailsArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
};


export type QueryGetCouponPaymentsArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
  userId: Scalars['Float'];
};


export type QueryGetCustomerDetailArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetCustomersArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  search?: InputMaybe<Scalars['String']>;
};


export type QueryGetCustomersCountArgs = {
  search?: InputMaybe<Scalars['String']>;
};


export type QueryGetFruitPaymentArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetHoldRequestArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetHoldRequestByStatusArgs = {
  status: Scalars['Float'];
};


export type QueryGetMemberPaymentArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetMemberPaymentDetailArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
};


export type QueryGetMemberPaymentsArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
  userId: Scalars['Float'];
};


export type QueryGetSellerArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
};


export type QueryGetTicketPaymentArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
  userId: Scalars['Float'];
};


export type QueryGetTrainningPaymentArgs = {
  customer_id: Scalars['Float'];
};


export type QueryGetTrainningPaymentDetailArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
};


export type QueryGetTrainningPaymentsArgs = {
  dateFrom: Scalars['String'];
  dateTo: Scalars['String'];
  userId: Scalars['Float'];
};


export type QueryMemberPaymentDetailArgs = {
  payment_id: Scalars['Float'];
};


export type QueryCheckinLookupCouponArgs = {
  coupon_code: Scalars['String'];
};


export type QueryCheckinLookupMemberArgs = {
  customer_id: Scalars['Float'];
};


export type QueryCheckinLookupTicketArgs = {
  station_place?: InputMaybe<Scalars['String']>;
  ticket_code: Scalars['String'];
};


export type QueryCheckoutLookupMemberArgs = {
  customer_id: Scalars['Float'];
};


export type QueryCustomerScanReportArgs = {
  fromDate: Scalars['String'];
  memberId: Scalars['Float'];
  toDate: Scalars['String'];
};


export type QueryCustomersByMembershipDurationArgs = {
  fromDate: Scalars['String'];
  toDate: Scalars['String'];
};


export type QueryExpiringCustomersOnDateArgs = {
  fromDate: Scalars['String'];
  toDate: Scalars['String'];
};


export type QueryGetMemberPriceByIdArgs = {
  id: Scalars['Float'];
};


export type QueryGet_UserArgs = {
  user_id: Scalars['ID'];
};

export type RegisterInput = {
  display_name: Scalars['String'];
  password: Scalars['String'];
  phone: Scalars['String'];
  role: Scalars['String'];
  username: Scalars['String'];
};

export type ScanLog = {
  __typename?: 'ScanLog';
  scanDate: Scalars['String'];
};

/** Derived from selected facilities. */
export enum ServiceType {
  Swim = 'Swim',
  SwimGym = 'SwimGym',
  SwimGymSteam = 'SwimGymSteam',
  SwimSteam = 'SwimSteam'
}

export enum Shift {
  Full = 'Full',
  Morning = 'Morning'
}

/** Full or Morning shift. */
export enum ShiftType {
  Full = 'Full',
  Morning = 'Morning'
}

export type TicketPayment = {
  __typename?: 'TicketPayment';
  is_check: Scalars['Float'];
  payment_date: Scalars['String'];
  payment_id: Scalars['Float'];
  price: Scalars['Float'];
  ticket_code: Scalars['String'];
  user_id: Scalars['Float'];
};

export type TicketPaymentMutationResponse = {
  __typename?: 'TicketPaymentMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  payment_id: Scalars['Float'];
  success: Scalars['Boolean'];
};

export type TicketPriceConfig = {
  __typename?: 'TicketPriceConfig';
  age_group?: Maybe<Scalars['String']>;
  config_id: Scalars['Float'];
  facilities: Array<Facility>;
  key_image?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
  price: Scalars['Float'];
};

export type TicketType = {
  __typename?: 'TicketType';
  payment_date: Scalars['String'];
  price: Scalars['Float'];
  qty: Scalars['Float'];
};

export type TrainningPayment = {
  __typename?: 'TrainningPayment';
  customer_id: Scalars['Float'];
  payment_date: Scalars['String'];
  payment_id: Scalars['Float'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  type: Scalars['String'];
  user_id: Scalars['Float'];
};

export type TrainningPaymentMutationResponse = {
  __typename?: 'TrainningPaymentMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  payment_id: Scalars['Float'];
  success: Scalars['Boolean'];
};

export type TrainningPrice = {
  __typename?: 'TrainningPrice';
  id: Scalars['Float'];
  month_qty: Scalars['Float'];
  name: Scalars['String'];
  price: Scalars['Float'];
  type: Scalars['String'];
};

export type TrainningType = {
  __typename?: 'TrainningType';
  customer_name: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  qty: Scalars['Float'];
};

export type Transfer = {
  __typename?: 'Transfer';
  fee: Scalars['Float'];
  receiver_id: Scalars['Float'];
  receiver_new_end: Scalars['String'];
  receiver_old_end: Scalars['String'];
  request_id: Scalars['Float'];
  sender_id: Scalars['Float'];
  sender_new_end: Scalars['String'];
  sender_old_date: Scalars['String'];
  transfer_by: Scalars['Float'];
  transfer_date: Scalars['String'];
  transfer_id: Scalars['Float'];
};

export type TransferJoin = {
  __typename?: 'TransferJoin';
  approved_by?: Maybe<Scalars['Float']>;
  approved_date?: Maybe<Scalars['String']>;
  approver_comment?: Maybe<Scalars['String']>;
  approver_name?: Maybe<Scalars['String']>;
  approver_status: ApprovalStatus;
  checked_by?: Maybe<Scalars['Float']>;
  checked_date?: Maybe<Scalars['String']>;
  checker_comment?: Maybe<Scalars['String']>;
  checker_name?: Maybe<Scalars['String']>;
  checker_status: ApprovalStatus;
  display_name: Scalars['String'];
  process: ProcessStatus;
  processed_by?: Maybe<Scalars['Float']>;
  processed_date?: Maybe<Scalars['String']>;
  processed_name?: Maybe<Scalars['String']>;
  reason: Scalars['String'];
  receiver_id: Scalars['Float'];
  receiver_name: Scalars['String'];
  receiver_old_end: Scalars['String'];
  receiver_phone: Scalars['String'];
  request_by: Scalars['Float'];
  request_date: Scalars['String'];
  request_id: Scalars['Float'];
  sender_id: Scalars['Float'];
  sender_name: Scalars['String'];
  sender_old_end: Scalars['String'];
  sender_phone: Scalars['String'];
};

export type TransferMutationResponse = TransferResponse & {
  __typename?: 'TransferMutationResponse';
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
  transfer_id?: Maybe<Scalars['Float']>;
};

export type TransferRequest = {
  __typename?: 'TransferRequest';
  approved_by?: Maybe<Scalars['Float']>;
  approved_date?: Maybe<Scalars['String']>;
  approver_comment?: Maybe<Scalars['String']>;
  approver_status: ApprovalStatus;
  checked_by?: Maybe<Scalars['Float']>;
  checked_date?: Maybe<Scalars['String']>;
  checker_comment?: Maybe<Scalars['String']>;
  checker_status: ApprovalStatus;
  process: ProcessStatus;
  processed_by?: Maybe<Scalars['Float']>;
  processed_date?: Maybe<Scalars['String']>;
  reason: Scalars['String'];
  receiver_id: Scalars['Float'];
  request_by: Scalars['Float'];
  request_date: Scalars['String'];
  request_id: Scalars['Float'];
  sender_id: Scalars['Float'];
};

export type TransferResponse = {
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
  transfer_id?: Maybe<Scalars['Float']>;
};

export type UserMutationResponse = IMutationResponse & {
  __typename?: 'UserMutationResponse';
  accessToken?: Maybe<Scalars['String']>;
  code: Scalars['Float'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
  user?: Maybe<Users>;
};

export type Users = {
  __typename?: 'Users';
  created_at: Scalars['String'];
  display_name: Scalars['String'];
  image: Scalars['String'];
  is_active: Scalars['Float'];
  phone: Scalars['String'];
  role: Scalars['String'];
  user_id: Scalars['ID'];
  username: Scalars['String'];
};

export type CreateCouponPaymentMutationVariables = Exact<{
  couponCode: Scalars['String'];
  quantity: Scalars['Float'];
  price: Scalars['Float'];
  cardName: Scalars['String'];
  customerId: Scalars['Float'];
  userId: Scalars['Float'];
}>;


export type CreateCouponPaymentMutation = { __typename?: 'Mutation', CreateCouponPayment: { __typename?: 'CouponPaymentMutationResponse', payment_id: number, code: number, success: boolean, message?: string | null } };

export type GetCouponCardQueryVariables = Exact<{
  couponCode: Scalars['String'];
}>;


export type GetCouponCardQuery = { __typename?: 'Query', GetCouponCard: Array<{ __typename?: 'CouponCard', id: number, created_date: string, coupon_code: string, status: string, quantity: number, price: number, card_name: string }> };

export type CreateCustomerMutationVariables = Exact<{
  createdBy: Scalars['Float'];
  gender: Scalars['String'];
  phone: Scalars['String'];
  customerName: Scalars['String'];
}>;


export type CreateCustomerMutation = { __typename?: 'Mutation', CreateCustomer: { __typename?: 'CustomerMutationResponse', code: number, success: boolean, message?: string | null } };

export type GetCustomerDetailQueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetCustomerDetailQuery = { __typename?: 'Query', GetCustomerDetail: Array<{ __typename?: 'Customer', customer_id: number, created_date: string, created_by: number, customer_code: string, customer_name: string, phone: string, gender: string, image_path?: string | null, fingerprint: string, end_membership_date: string, end_fruit_date: string, key_status: string, towel_status: string, shift: string }> };

export type GetCustomersCountQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']>;
}>;


export type GetCustomersCountQuery = { __typename?: 'Query', GetCustomersCount: number };

export type GetCustomersQueryVariables = Exact<{
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  search?: InputMaybe<Scalars['String']>;
}>;


export type GetCustomersQuery = { __typename?: 'Query', GetCustomers: Array<{ __typename?: 'Customer', customer_id: number, created_date: string, created_by: number, customer_code: string, customer_name: string, phone: string, gender: string, image_path?: string | null, fingerprint: string, end_membership_date: string, key_status: string, towel_status: string }> };

export type UpdateCustomerMutationVariables = Exact<{
  phone: Scalars['String'];
  customerId: Scalars['Float'];
}>;


export type UpdateCustomerMutation = { __typename?: 'Mutation', UpdateCustomer: { __typename?: 'CustomerMutationResponse', code: number, success: boolean, message?: string | null } };

export type GetMemberPriceTableQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMemberPriceTableQuery = { __typename?: 'Query', getAllMemberPriceTable: Array<{ __typename?: 'MemberPriceTable', id: number, description: string, ageGroup: AgeGroup, customerType: CustomerType, serviceType: ServiceType, shift: ShiftType, monthQty: number, price: number, entryQty: number }> };

export type GetFacilitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFacilitiesQuery = { __typename?: 'Query', facilities: Array<{ __typename?: 'Facility', facility_id: number, code: string, name: string }> };

export type CreateFruitPaymentMutationVariables = Exact<{
  monthQty: Scalars['Float'];
  newEnd: Scalars['String'];
  oldEnd: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  customerId: Scalars['Float'];
  userId: Scalars['Float'];
}>;


export type CreateFruitPaymentMutation = { __typename?: 'Mutation', CreateFruitPayment: { __typename?: 'FruitPaymentMutationResponse', payment_id: number, code: number, success: boolean, message?: string | null } };

export type GetFruitPaymentQueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetFruitPaymentQuery = { __typename?: 'Query', GetFruitPayment: Array<{ __typename?: 'FruitPayment', payment_id: number, payment_date: any, user_id: number, customer_id: number, promotion: string, price: number, old_end: string, new_end: string, month_qty: number }> };

export type GetFruitPriceTableQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFruitPriceTableQuery = { __typename?: 'Query', GetFruitPriceTable: Array<{ __typename?: 'FruitPrice', id: number, name: string, age: string, month_qty: number, price: number }> };

export type ApproveHoldRequestMutationVariables = Exact<{
  approverStatus: Scalars['String'];
  approverComment: Scalars['String'];
  approvedBy: Scalars['Float'];
  requestId: Scalars['Float'];
}>;


export type ApproveHoldRequestMutation = { __typename?: 'Mutation', ApproveHoldRequest: { __typename?: 'HoldMutationResponse', code: number, success: boolean, message?: string | null } };

export type CheckHoldRequestMutationVariables = Exact<{
  checkerStatus: Scalars['String'];
  checkerComment: Scalars['String'];
  checkedBy: Scalars['Float'];
  requestId: Scalars['Float'];
}>;


export type CheckHoldRequestMutation = { __typename?: 'Mutation', CheckHoldRequest: { __typename?: 'HoldMutationResponse', code: number, success: boolean, message?: string | null } };

export type CreateHoldMutationVariables = Exact<{
  newEnd: Scalars['String'];
  customerId: Scalars['Float'];
  requestId: Scalars['Float'];
  processedBy: Scalars['Float'];
}>;


export type CreateHoldMutation = { __typename?: 'Mutation', CreateHold: { __typename?: 'HoldMutationResponse', code: number, success: boolean, message?: string | null, hold_id?: number | null } };

export type CreateHoldRequestMutationVariables = Exact<{
  newEnd: Scalars['String'];
  oldEnd: Scalars['String'];
  toDate: Scalars['String'];
  fromDate: Scalars['String'];
  reason: Scalars['String'];
  customerId: Scalars['Float'];
  requestBy: Scalars['Float'];
}>;


export type CreateHoldRequestMutation = { __typename?: 'Mutation', CreateHoldRequest: { __typename?: 'HoldMutationResponse', code: number, success: boolean, message?: string | null } };

export type CreateHoldRequestV2MutationVariables = Exact<{
  customerId: Scalars['Float'];
  reason: Scalars['String'];
  fromDate: Scalars['String'];
  toDate: Scalars['String'];
}>;


export type CreateHoldRequestV2Mutation = { __typename?: 'Mutation', CreateHoldRequestV2: { __typename?: 'HoldV2Response', code: number, success: boolean, message?: string | null } };

export type DecideHoldRequestV2MutationVariables = Exact<{
  requestId: Scalars['Float'];
  approve: Scalars['Boolean'];
  note?: InputMaybe<Scalars['String']>;
}>;


export type DecideHoldRequestV2Mutation = { __typename?: 'Mutation', DecideHoldRequestV2: { __typename?: 'HoldV2Response', code: number, success: boolean, message?: string | null } };

export type GetActiveHoldRequestV2QueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetActiveHoldRequestV2Query = { __typename?: 'Query', GetActiveHoldRequestV2: Array<{ __typename?: 'HoldRequestV2', request_id: number, status: string, from_date: string, to_date: string, reason: string }> };

export type GetHoldRequestQueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetHoldRequestQuery = { __typename?: 'Query', GetHoldRequest: Array<{ __typename?: 'HoldRequest', from_date: string, to_date: string, process: string, checker_status: string }> };

export type GetHoldRequestByStatusQueryVariables = Exact<{
  status: Scalars['Float'];
}>;


export type GetHoldRequestByStatusQuery = { __typename?: 'Query', GetHoldRequestByStatus: Array<{ __typename?: 'HoldRequest', request_id: number, request_by: number, request_date: string, customer_id: number, reason: string, from_date: string, to_date: string, old_end: string, new_end: string, checked_by: number, checker_comment: string, checked_date: string, checker_status: string, approved_by: number, approver_comment: string, approved_date: string, approver_status: string, process: string, processed_by: number }> };

export type HoldRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type HoldRequestsQuery = { __typename?: 'Query', HoldRequests: Array<{ __typename?: 'HoldJoin', request_id: number, request_by: number, request_date: string, customer_id: number, reason: string, from_date: string, to_date: string, old_end: string, new_end: string, checked_by: number, checker_comment: string, checked_date: string, checker_status: string, approved_by: number, approver_comment: string, approved_date: string, approver_status: string, display_name: string, customer_name: string, checker_name?: string | null, approved_name?: string | null, process: string, processed_name?: string | null, processed_by: number, phone: string }> };

export type HoldRequestsV2QueryVariables = Exact<{ [key: string]: never; }>;


export type HoldRequestsV2Query = { __typename?: 'Query', HoldRequestsV2: Array<{ __typename?: 'HoldRequestV2Row', request_id: number, customer_id: number, customer_name: string, phone: string, requested_by: number, requested_by_name?: string | null, requested_at: string, reason: string, from_date: string, to_date: string, status: string, decided_by?: number | null, decided_by_name?: string | null, decided_at?: string | null, decision_note?: string | null, processed_by?: number | null, processed_by_name?: string | null, processed_at?: string | null, old_end?: string | null, new_end?: string | null, fee: string, legacy: number }> };

export type ProcessHoldV2MutationVariables = Exact<{
  requestId: Scalars['Float'];
  fee?: InputMaybe<Scalars['Float']>;
}>;


export type ProcessHoldV2Mutation = { __typename?: 'Mutation', ProcessHoldV2: { __typename?: 'HoldV2Response', code: number, success: boolean, message?: string | null, new_end?: string | null } };

export type GetMemberPaymentDetailQueryVariables = Exact<{
  dateTo: Scalars['String'];
  dateFrom: Scalars['String'];
}>;


export type GetMemberPaymentDetailQuery = { __typename?: 'Query', GetMemberPaymentDetail: Array<{ __typename?: 'MemberType', price: number, promotion: string, customer_name: string }> };

export type LoginMutationVariables = Exact<{
  loginInput: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'UserMutationResponse', code: number, success: boolean, message?: string | null, accessToken?: string | null, user?: { __typename?: 'Users', display_name: string, role: string, user_id: string } | null } };

export type CreateCustomerPaymentMutationVariables = Exact<{
  monthQty: Scalars['Float'];
  shift: Scalars['String'];
  startDate: Scalars['String'];
  newEnd: Scalars['String'];
  oldEnd: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  customerId: Scalars['Float'];
  userId: Scalars['Float'];
}>;


export type CreateCustomerPaymentMutation = { __typename?: 'Mutation', CreateCustomerPayment: { __typename?: 'MemberPaymentMutationResponse', payment_id: number, code: number, success: boolean, message?: string | null } };

export type GetMemberPaymentQueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetMemberPaymentQuery = { __typename?: 'Query', GetMemberPayment: Array<{ __typename?: 'MemberPayment', payment_id: number, payment_date: any, user_id: number, customer_id: number, promotion: string, price: number, start_date: string, old_end: string, new_end: string, shift: string, month_qty: number }> };

export type MemberPaymentDetailQueryVariables = Exact<{
  paymentId: Scalars['Float'];
}>;


export type MemberPaymentDetailQuery = { __typename?: 'Query', MemberPaymentDetail: { __typename?: 'MemberPaymentDetail', payment_id: number, payment_date: any, display_name: string, customer_name: string, phone: string, promotion: string, price: number, old_end: any, new_end: any } };

export type CreateTicketPaymentMutationVariables = Exact<{
  ticketCode: Scalars['String'];
  price: Scalars['Float'];
  userId: Scalars['Float'];
}>;


export type CreateTicketPaymentMutation = { __typename?: 'Mutation', CreateTicketPayment: { __typename?: 'TicketPaymentMutationResponse', payment_id: number, code: number, success: boolean, message?: string | null } };

export type GetTicketPriceConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTicketPriceConfigsQuery = { __typename?: 'Query', GetTicketPriceConfigs: Array<{ __typename?: 'TicketPriceConfig', config_id: number, price: number, label?: string | null, age_group?: string | null, key_image?: string | null, facilities: Array<{ __typename?: 'Facility', facility_id: number, name: string, code: string }> }> };

export type UpsertTicketPriceConfigMutationVariables = Exact<{
  price: Scalars['Float'];
  facility_ids: Array<Scalars['Float']> | Scalars['Float'];
  label?: InputMaybe<Scalars['String']>;
  key_image?: InputMaybe<Scalars['String']>;
  age_group?: InputMaybe<Scalars['String']>;
}>;


export type UpsertTicketPriceConfigMutation = { __typename?: 'Mutation', UpsertTicketPriceConfig: { __typename?: 'TicketPriceConfig', config_id: number, price: number, label?: string | null, age_group?: string | null, key_image?: string | null, facilities: Array<{ __typename?: 'Facility', facility_id: number, name: string, code: string }> } };

export type DeleteTicketPriceConfigMutationVariables = Exact<{
  config_id: Scalars['Float'];
}>;


export type DeleteTicketPriceConfigMutation = { __typename?: 'Mutation', DeleteTicketPriceConfig: boolean };

export type CreateTrainningPaymentMutationVariables = Exact<{
  type: Scalars['String'];
  price: Scalars['Float'];
  promotion: Scalars['String'];
  customerId: Scalars['Float'];
  userId: Scalars['Float'];
}>;


export type CreateTrainningPaymentMutation = { __typename?: 'Mutation', CreateTrainningPayment: { __typename?: 'TrainningPaymentMutationResponse', payment_id: number, code: number, success: boolean, message?: string | null } };

export type GetTrainningPaymentQueryVariables = Exact<{
  customerId: Scalars['Float'];
}>;


export type GetTrainningPaymentQuery = { __typename?: 'Query', GetTrainningPayment: Array<{ __typename?: 'TrainningPayment', payment_id: number, payment_date: string, user_id: number, customer_id: number, type: string, promotion: string, price: number }> };

export type GetTranningPriceQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTranningPriceQuery = { __typename?: 'Query', GetTranningPrice: Array<{ __typename?: 'TrainningPrice', id: number, name: string, type: string, month_qty: number, price: number }> };

export type ApproveTransferRequestMutationVariables = Exact<{
  approverStatus: ApprovalStatus;
  approverComment: Scalars['String'];
  requestId: Scalars['Float'];
}>;


export type ApproveTransferRequestMutation = { __typename?: 'Mutation', ApproveTransferRequest: { __typename?: 'TransferMutationResponse', code: number, success: boolean, message?: string | null } };

export type CheckTransferRequestMutationVariables = Exact<{
  checkerStatus: ApprovalStatus;
  checkerComment: Scalars['String'];
  requestId: Scalars['Float'];
}>;


export type CheckTransferRequestMutation = { __typename?: 'Mutation', CheckTransferRequest: { __typename?: 'TransferMutationResponse', code: number, success: boolean, message?: string | null } };

export type CreateTransferMutationVariables = Exact<{
  requestId: Scalars['Float'];
  fee?: InputMaybe<Scalars['Float']>;
}>;


export type CreateTransferMutation = { __typename?: 'Mutation', CreateTransfer: { __typename?: 'TransferMutationResponse', code: number, success: boolean, message?: string | null, transfer_id?: number | null } };

export type CreateTransferRequestMutationVariables = Exact<{
  reason: Scalars['String'];
  receiverId: Scalars['Float'];
  senderId: Scalars['Float'];
}>;


export type CreateTransferRequestMutation = { __typename?: 'Mutation', CreateTransferRequest: { __typename?: 'TransferMutationResponse', code: number, success: boolean, message?: string | null } };

export type TransferRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type TransferRequestsQuery = { __typename?: 'Query', TransferRequests: Array<{ __typename?: 'TransferJoin', request_id: number, request_by: number, request_date: string, reason: string, sender_id: number, receiver_id: number, checked_by?: number | null, checker_comment?: string | null, checked_date?: string | null, checker_status: ApprovalStatus, approved_by?: number | null, approver_comment?: string | null, approved_date?: string | null, approver_status: ApprovalStatus, process: ProcessStatus, processed_by?: number | null, processed_date?: string | null, display_name: string, sender_name: string, sender_phone: string, receiver_name: string, receiver_phone: string, checker_name?: string | null, processed_name?: string | null, approver_name?: string | null, receiver_old_end: string, sender_old_end: string }> };


export const CreateCouponPaymentDocument = gql`
    mutation CreateCouponPayment($couponCode: String!, $quantity: Float!, $price: Float!, $cardName: String!, $customerId: Float!, $userId: Float!) {
  CreateCouponPayment(
    coupon_code: $couponCode
    quantity: $quantity
    price: $price
    card_name: $cardName
    customer_id: $customerId
    user_id: $userId
  ) {
    payment_id
    code
    success
    message
  }
}
    `;
export type CreateCouponPaymentMutationFn = Apollo.MutationFunction<CreateCouponPaymentMutation, CreateCouponPaymentMutationVariables>;

/**
 * __useCreateCouponPaymentMutation__
 *
 * To run a mutation, you first call `useCreateCouponPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCouponPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCouponPaymentMutation, { data, loading, error }] = useCreateCouponPaymentMutation({
 *   variables: {
 *      couponCode: // value for 'couponCode'
 *      quantity: // value for 'quantity'
 *      price: // value for 'price'
 *      cardName: // value for 'cardName'
 *      customerId: // value for 'customerId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateCouponPaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateCouponPaymentMutation, CreateCouponPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCouponPaymentMutation, CreateCouponPaymentMutationVariables>(CreateCouponPaymentDocument, options);
      }
export type CreateCouponPaymentMutationHookResult = ReturnType<typeof useCreateCouponPaymentMutation>;
export type CreateCouponPaymentMutationResult = Apollo.MutationResult<CreateCouponPaymentMutation>;
export type CreateCouponPaymentMutationOptions = Apollo.BaseMutationOptions<CreateCouponPaymentMutation, CreateCouponPaymentMutationVariables>;
export const GetCouponCardDocument = gql`
    query GetCouponCard($couponCode: String!) {
  GetCouponCard(coupon_code: $couponCode) {
    id
    created_date
    coupon_code
    status
    quantity
    price
    card_name
  }
}
    `;

/**
 * __useGetCouponCardQuery__
 *
 * To run a query within a React component, call `useGetCouponCardQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCouponCardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCouponCardQuery({
 *   variables: {
 *      couponCode: // value for 'couponCode'
 *   },
 * });
 */
export function useGetCouponCardQuery(baseOptions: Apollo.QueryHookOptions<GetCouponCardQuery, GetCouponCardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCouponCardQuery, GetCouponCardQueryVariables>(GetCouponCardDocument, options);
      }
export function useGetCouponCardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCouponCardQuery, GetCouponCardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCouponCardQuery, GetCouponCardQueryVariables>(GetCouponCardDocument, options);
        }
export type GetCouponCardQueryHookResult = ReturnType<typeof useGetCouponCardQuery>;
export type GetCouponCardLazyQueryHookResult = ReturnType<typeof useGetCouponCardLazyQuery>;
export type GetCouponCardQueryResult = Apollo.QueryResult<GetCouponCardQuery, GetCouponCardQueryVariables>;
export const CreateCustomerDocument = gql`
    mutation CreateCustomer($createdBy: Float!, $gender: String!, $phone: String!, $customerName: String!) {
  CreateCustomer(
    created_by: $createdBy
    gender: $gender
    phone: $phone
    customer_name: $customerName
  ) {
    code
    success
    message
  }
}
    `;
export type CreateCustomerMutationFn = Apollo.MutationFunction<CreateCustomerMutation, CreateCustomerMutationVariables>;

/**
 * __useCreateCustomerMutation__
 *
 * To run a mutation, you first call `useCreateCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCustomerMutation, { data, loading, error }] = useCreateCustomerMutation({
 *   variables: {
 *      createdBy: // value for 'createdBy'
 *      gender: // value for 'gender'
 *      phone: // value for 'phone'
 *      customerName: // value for 'customerName'
 *   },
 * });
 */
export function useCreateCustomerMutation(baseOptions?: Apollo.MutationHookOptions<CreateCustomerMutation, CreateCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCustomerMutation, CreateCustomerMutationVariables>(CreateCustomerDocument, options);
      }
export type CreateCustomerMutationHookResult = ReturnType<typeof useCreateCustomerMutation>;
export type CreateCustomerMutationResult = Apollo.MutationResult<CreateCustomerMutation>;
export type CreateCustomerMutationOptions = Apollo.BaseMutationOptions<CreateCustomerMutation, CreateCustomerMutationVariables>;
export const GetCustomerDetailDocument = gql`
    query GetCustomerDetail($customerId: Float!) {
  GetCustomerDetail(customer_id: $customerId) {
    customer_id
    created_date
    created_by
    customer_code
    customer_name
    phone
    gender
    image_path
    fingerprint
    end_membership_date
    end_fruit_date
    key_status
    towel_status
    shift
  }
}
    `;

/**
 * __useGetCustomerDetailQuery__
 *
 * To run a query within a React component, call `useGetCustomerDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerDetailQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetCustomerDetailQuery(baseOptions: Apollo.QueryHookOptions<GetCustomerDetailQuery, GetCustomerDetailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerDetailQuery, GetCustomerDetailQueryVariables>(GetCustomerDetailDocument, options);
      }
export function useGetCustomerDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerDetailQuery, GetCustomerDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerDetailQuery, GetCustomerDetailQueryVariables>(GetCustomerDetailDocument, options);
        }
export type GetCustomerDetailQueryHookResult = ReturnType<typeof useGetCustomerDetailQuery>;
export type GetCustomerDetailLazyQueryHookResult = ReturnType<typeof useGetCustomerDetailLazyQuery>;
export type GetCustomerDetailQueryResult = Apollo.QueryResult<GetCustomerDetailQuery, GetCustomerDetailQueryVariables>;
export const GetCustomersCountDocument = gql`
    query GetCustomersCount($search: String) {
  GetCustomersCount(search: $search)
}
    `;

/**
 * __useGetCustomersCountQuery__
 *
 * To run a query within a React component, call `useGetCustomersCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomersCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomersCountQuery({
 *   variables: {
 *      search: // value for 'search'
 *   },
 * });
 */
export function useGetCustomersCountQuery(baseOptions?: Apollo.QueryHookOptions<GetCustomersCountQuery, GetCustomersCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomersCountQuery, GetCustomersCountQueryVariables>(GetCustomersCountDocument, options);
      }
export function useGetCustomersCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomersCountQuery, GetCustomersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomersCountQuery, GetCustomersCountQueryVariables>(GetCustomersCountDocument, options);
        }
export type GetCustomersCountQueryHookResult = ReturnType<typeof useGetCustomersCountQuery>;
export type GetCustomersCountLazyQueryHookResult = ReturnType<typeof useGetCustomersCountLazyQuery>;
export type GetCustomersCountQueryResult = Apollo.QueryResult<GetCustomersCountQuery, GetCustomersCountQueryVariables>;
export const GetCustomersDocument = gql`
    query GetCustomers($limit: Int!, $offset: Int!, $search: String) {
  GetCustomers(limit: $limit, offset: $offset, search: $search) {
    customer_id
    created_date
    created_by
    customer_code
    customer_name
    phone
    gender
    image_path
    fingerprint
    end_membership_date
    key_status
    towel_status
  }
}
    `;

/**
 * __useGetCustomersQuery__
 *
 * To run a query within a React component, call `useGetCustomersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useGetCustomersQuery(baseOptions: Apollo.QueryHookOptions<GetCustomersQuery, GetCustomersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomersQuery, GetCustomersQueryVariables>(GetCustomersDocument, options);
      }
export function useGetCustomersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomersQuery, GetCustomersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomersQuery, GetCustomersQueryVariables>(GetCustomersDocument, options);
        }
export type GetCustomersQueryHookResult = ReturnType<typeof useGetCustomersQuery>;
export type GetCustomersLazyQueryHookResult = ReturnType<typeof useGetCustomersLazyQuery>;
export type GetCustomersQueryResult = Apollo.QueryResult<GetCustomersQuery, GetCustomersQueryVariables>;
export const UpdateCustomerDocument = gql`
    mutation UpdateCustomer($phone: String!, $customerId: Float!) {
  UpdateCustomer(phone: $phone, customer_id: $customerId) {
    code
    success
    message
  }
}
    `;
export type UpdateCustomerMutationFn = Apollo.MutationFunction<UpdateCustomerMutation, UpdateCustomerMutationVariables>;

/**
 * __useUpdateCustomerMutation__
 *
 * To run a mutation, you first call `useUpdateCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCustomerMutation, { data, loading, error }] = useUpdateCustomerMutation({
 *   variables: {
 *      phone: // value for 'phone'
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useUpdateCustomerMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCustomerMutation, UpdateCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCustomerMutation, UpdateCustomerMutationVariables>(UpdateCustomerDocument, options);
      }
export type UpdateCustomerMutationHookResult = ReturnType<typeof useUpdateCustomerMutation>;
export type UpdateCustomerMutationResult = Apollo.MutationResult<UpdateCustomerMutation>;
export type UpdateCustomerMutationOptions = Apollo.BaseMutationOptions<UpdateCustomerMutation, UpdateCustomerMutationVariables>;
export const GetMemberPriceTableDocument = gql`
    query GetMemberPriceTable {
  getAllMemberPriceTable {
    id
    description
    ageGroup
    customerType
    serviceType
    shift
    monthQty
    price
    entryQty
  }
}
    `;

/**
 * __useGetMemberPriceTableQuery__
 *
 * To run a query within a React component, call `useGetMemberPriceTableQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMemberPriceTableQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMemberPriceTableQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMemberPriceTableQuery(baseOptions?: Apollo.QueryHookOptions<GetMemberPriceTableQuery, GetMemberPriceTableQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMemberPriceTableQuery, GetMemberPriceTableQueryVariables>(GetMemberPriceTableDocument, options);
      }
export function useGetMemberPriceTableLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMemberPriceTableQuery, GetMemberPriceTableQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMemberPriceTableQuery, GetMemberPriceTableQueryVariables>(GetMemberPriceTableDocument, options);
        }
export type GetMemberPriceTableQueryHookResult = ReturnType<typeof useGetMemberPriceTableQuery>;
export type GetMemberPriceTableLazyQueryHookResult = ReturnType<typeof useGetMemberPriceTableLazyQuery>;
export type GetMemberPriceTableQueryResult = Apollo.QueryResult<GetMemberPriceTableQuery, GetMemberPriceTableQueryVariables>;
export const GetFacilitiesDocument = gql`
    query GetFacilities {
  facilities {
    facility_id
    code
    name
  }
}
    `;

/**
 * __useGetFacilitiesQuery__
 *
 * To run a query within a React component, call `useGetFacilitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFacilitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFacilitiesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFacilitiesQuery(baseOptions?: Apollo.QueryHookOptions<GetFacilitiesQuery, GetFacilitiesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFacilitiesQuery, GetFacilitiesQueryVariables>(GetFacilitiesDocument, options);
      }
export function useGetFacilitiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFacilitiesQuery, GetFacilitiesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFacilitiesQuery, GetFacilitiesQueryVariables>(GetFacilitiesDocument, options);
        }
export type GetFacilitiesQueryHookResult = ReturnType<typeof useGetFacilitiesQuery>;
export type GetFacilitiesLazyQueryHookResult = ReturnType<typeof useGetFacilitiesLazyQuery>;
export type GetFacilitiesQueryResult = Apollo.QueryResult<GetFacilitiesQuery, GetFacilitiesQueryVariables>;
export const CreateFruitPaymentDocument = gql`
    mutation CreateFruitPayment($monthQty: Float!, $newEnd: String!, $oldEnd: String!, $price: Float!, $promotion: String!, $customerId: Float!, $userId: Float!) {
  CreateFruitPayment(
    month_qty: $monthQty
    new_end: $newEnd
    old_end: $oldEnd
    price: $price
    promotion: $promotion
    customer_id: $customerId
    user_id: $userId
  ) {
    payment_id
    code
    success
    message
  }
}
    `;
export type CreateFruitPaymentMutationFn = Apollo.MutationFunction<CreateFruitPaymentMutation, CreateFruitPaymentMutationVariables>;

/**
 * __useCreateFruitPaymentMutation__
 *
 * To run a mutation, you first call `useCreateFruitPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFruitPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFruitPaymentMutation, { data, loading, error }] = useCreateFruitPaymentMutation({
 *   variables: {
 *      monthQty: // value for 'monthQty'
 *      newEnd: // value for 'newEnd'
 *      oldEnd: // value for 'oldEnd'
 *      price: // value for 'price'
 *      promotion: // value for 'promotion'
 *      customerId: // value for 'customerId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateFruitPaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateFruitPaymentMutation, CreateFruitPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateFruitPaymentMutation, CreateFruitPaymentMutationVariables>(CreateFruitPaymentDocument, options);
      }
export type CreateFruitPaymentMutationHookResult = ReturnType<typeof useCreateFruitPaymentMutation>;
export type CreateFruitPaymentMutationResult = Apollo.MutationResult<CreateFruitPaymentMutation>;
export type CreateFruitPaymentMutationOptions = Apollo.BaseMutationOptions<CreateFruitPaymentMutation, CreateFruitPaymentMutationVariables>;
export const GetFruitPaymentDocument = gql`
    query GetFruitPayment($customerId: Float!) {
  GetFruitPayment(customer_id: $customerId) {
    payment_id
    payment_date
    user_id
    customer_id
    promotion
    price
    old_end
    new_end
    month_qty
  }
}
    `;

/**
 * __useGetFruitPaymentQuery__
 *
 * To run a query within a React component, call `useGetFruitPaymentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFruitPaymentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFruitPaymentQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetFruitPaymentQuery(baseOptions: Apollo.QueryHookOptions<GetFruitPaymentQuery, GetFruitPaymentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFruitPaymentQuery, GetFruitPaymentQueryVariables>(GetFruitPaymentDocument, options);
      }
export function useGetFruitPaymentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFruitPaymentQuery, GetFruitPaymentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFruitPaymentQuery, GetFruitPaymentQueryVariables>(GetFruitPaymentDocument, options);
        }
export type GetFruitPaymentQueryHookResult = ReturnType<typeof useGetFruitPaymentQuery>;
export type GetFruitPaymentLazyQueryHookResult = ReturnType<typeof useGetFruitPaymentLazyQuery>;
export type GetFruitPaymentQueryResult = Apollo.QueryResult<GetFruitPaymentQuery, GetFruitPaymentQueryVariables>;
export const GetFruitPriceTableDocument = gql`
    query GetFruitPriceTable {
  GetFruitPriceTable {
    id
    name
    age
    month_qty
    price
  }
}
    `;

/**
 * __useGetFruitPriceTableQuery__
 *
 * To run a query within a React component, call `useGetFruitPriceTableQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFruitPriceTableQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFruitPriceTableQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFruitPriceTableQuery(baseOptions?: Apollo.QueryHookOptions<GetFruitPriceTableQuery, GetFruitPriceTableQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFruitPriceTableQuery, GetFruitPriceTableQueryVariables>(GetFruitPriceTableDocument, options);
      }
export function useGetFruitPriceTableLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFruitPriceTableQuery, GetFruitPriceTableQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFruitPriceTableQuery, GetFruitPriceTableQueryVariables>(GetFruitPriceTableDocument, options);
        }
export type GetFruitPriceTableQueryHookResult = ReturnType<typeof useGetFruitPriceTableQuery>;
export type GetFruitPriceTableLazyQueryHookResult = ReturnType<typeof useGetFruitPriceTableLazyQuery>;
export type GetFruitPriceTableQueryResult = Apollo.QueryResult<GetFruitPriceTableQuery, GetFruitPriceTableQueryVariables>;
export const ApproveHoldRequestDocument = gql`
    mutation ApproveHoldRequest($approverStatus: String!, $approverComment: String!, $approvedBy: Float!, $requestId: Float!) {
  ApproveHoldRequest(
    approver_status: $approverStatus
    approver_comment: $approverComment
    approved_by: $approvedBy
    request_id: $requestId
  ) {
    code
    success
    message
  }
}
    `;
export type ApproveHoldRequestMutationFn = Apollo.MutationFunction<ApproveHoldRequestMutation, ApproveHoldRequestMutationVariables>;

/**
 * __useApproveHoldRequestMutation__
 *
 * To run a mutation, you first call `useApproveHoldRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveHoldRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveHoldRequestMutation, { data, loading, error }] = useApproveHoldRequestMutation({
 *   variables: {
 *      approverStatus: // value for 'approverStatus'
 *      approverComment: // value for 'approverComment'
 *      approvedBy: // value for 'approvedBy'
 *      requestId: // value for 'requestId'
 *   },
 * });
 */
export function useApproveHoldRequestMutation(baseOptions?: Apollo.MutationHookOptions<ApproveHoldRequestMutation, ApproveHoldRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveHoldRequestMutation, ApproveHoldRequestMutationVariables>(ApproveHoldRequestDocument, options);
      }
export type ApproveHoldRequestMutationHookResult = ReturnType<typeof useApproveHoldRequestMutation>;
export type ApproveHoldRequestMutationResult = Apollo.MutationResult<ApproveHoldRequestMutation>;
export type ApproveHoldRequestMutationOptions = Apollo.BaseMutationOptions<ApproveHoldRequestMutation, ApproveHoldRequestMutationVariables>;
export const CheckHoldRequestDocument = gql`
    mutation CheckHoldRequest($checkerStatus: String!, $checkerComment: String!, $checkedBy: Float!, $requestId: Float!) {
  CheckHoldRequest(
    checker_status: $checkerStatus
    checker_comment: $checkerComment
    checked_by: $checkedBy
    request_id: $requestId
  ) {
    code
    success
    message
  }
}
    `;
export type CheckHoldRequestMutationFn = Apollo.MutationFunction<CheckHoldRequestMutation, CheckHoldRequestMutationVariables>;

/**
 * __useCheckHoldRequestMutation__
 *
 * To run a mutation, you first call `useCheckHoldRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCheckHoldRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [checkHoldRequestMutation, { data, loading, error }] = useCheckHoldRequestMutation({
 *   variables: {
 *      checkerStatus: // value for 'checkerStatus'
 *      checkerComment: // value for 'checkerComment'
 *      checkedBy: // value for 'checkedBy'
 *      requestId: // value for 'requestId'
 *   },
 * });
 */
export function useCheckHoldRequestMutation(baseOptions?: Apollo.MutationHookOptions<CheckHoldRequestMutation, CheckHoldRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CheckHoldRequestMutation, CheckHoldRequestMutationVariables>(CheckHoldRequestDocument, options);
      }
export type CheckHoldRequestMutationHookResult = ReturnType<typeof useCheckHoldRequestMutation>;
export type CheckHoldRequestMutationResult = Apollo.MutationResult<CheckHoldRequestMutation>;
export type CheckHoldRequestMutationOptions = Apollo.BaseMutationOptions<CheckHoldRequestMutation, CheckHoldRequestMutationVariables>;
export const CreateHoldDocument = gql`
    mutation CreateHold($newEnd: String!, $customerId: Float!, $requestId: Float!, $processedBy: Float!) {
  CreateHold(
    new_end: $newEnd
    customer_id: $customerId
    request_id: $requestId
    processed_by: $processedBy
  ) {
    code
    success
    message
    hold_id
  }
}
    `;
export type CreateHoldMutationFn = Apollo.MutationFunction<CreateHoldMutation, CreateHoldMutationVariables>;

/**
 * __useCreateHoldMutation__
 *
 * To run a mutation, you first call `useCreateHoldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHoldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHoldMutation, { data, loading, error }] = useCreateHoldMutation({
 *   variables: {
 *      newEnd: // value for 'newEnd'
 *      customerId: // value for 'customerId'
 *      requestId: // value for 'requestId'
 *      processedBy: // value for 'processedBy'
 *   },
 * });
 */
export function useCreateHoldMutation(baseOptions?: Apollo.MutationHookOptions<CreateHoldMutation, CreateHoldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHoldMutation, CreateHoldMutationVariables>(CreateHoldDocument, options);
      }
export type CreateHoldMutationHookResult = ReturnType<typeof useCreateHoldMutation>;
export type CreateHoldMutationResult = Apollo.MutationResult<CreateHoldMutation>;
export type CreateHoldMutationOptions = Apollo.BaseMutationOptions<CreateHoldMutation, CreateHoldMutationVariables>;
export const CreateHoldRequestDocument = gql`
    mutation CreateHoldRequest($newEnd: String!, $oldEnd: String!, $toDate: String!, $fromDate: String!, $reason: String!, $customerId: Float!, $requestBy: Float!) {
  CreateHoldRequest(
    new_end: $newEnd
    old_end: $oldEnd
    to_date: $toDate
    from_date: $fromDate
    reason: $reason
    customer_id: $customerId
    request_by: $requestBy
  ) {
    code
    success
    message
  }
}
    `;
export type CreateHoldRequestMutationFn = Apollo.MutationFunction<CreateHoldRequestMutation, CreateHoldRequestMutationVariables>;

/**
 * __useCreateHoldRequestMutation__
 *
 * To run a mutation, you first call `useCreateHoldRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHoldRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHoldRequestMutation, { data, loading, error }] = useCreateHoldRequestMutation({
 *   variables: {
 *      newEnd: // value for 'newEnd'
 *      oldEnd: // value for 'oldEnd'
 *      toDate: // value for 'toDate'
 *      fromDate: // value for 'fromDate'
 *      reason: // value for 'reason'
 *      customerId: // value for 'customerId'
 *      requestBy: // value for 'requestBy'
 *   },
 * });
 */
export function useCreateHoldRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateHoldRequestMutation, CreateHoldRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHoldRequestMutation, CreateHoldRequestMutationVariables>(CreateHoldRequestDocument, options);
      }
export type CreateHoldRequestMutationHookResult = ReturnType<typeof useCreateHoldRequestMutation>;
export type CreateHoldRequestMutationResult = Apollo.MutationResult<CreateHoldRequestMutation>;
export type CreateHoldRequestMutationOptions = Apollo.BaseMutationOptions<CreateHoldRequestMutation, CreateHoldRequestMutationVariables>;
export const CreateHoldRequestV2Document = gql`
    mutation CreateHoldRequestV2($customerId: Float!, $reason: String!, $fromDate: String!, $toDate: String!) {
  CreateHoldRequestV2(
    customer_id: $customerId
    reason: $reason
    from_date: $fromDate
    to_date: $toDate
  ) {
    code
    success
    message
  }
}
    `;
export type CreateHoldRequestV2MutationFn = Apollo.MutationFunction<CreateHoldRequestV2Mutation, CreateHoldRequestV2MutationVariables>;

/**
 * __useCreateHoldRequestV2Mutation__
 *
 * To run a mutation, you first call `useCreateHoldRequestV2Mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHoldRequestV2Mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHoldRequestV2Mutation, { data, loading, error }] = useCreateHoldRequestV2Mutation({
 *   variables: {
 *      customerId: // value for 'customerId'
 *      reason: // value for 'reason'
 *      fromDate: // value for 'fromDate'
 *      toDate: // value for 'toDate'
 *   },
 * });
 */
export function useCreateHoldRequestV2Mutation(baseOptions?: Apollo.MutationHookOptions<CreateHoldRequestV2Mutation, CreateHoldRequestV2MutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHoldRequestV2Mutation, CreateHoldRequestV2MutationVariables>(CreateHoldRequestV2Document, options);
      }
export type CreateHoldRequestV2MutationHookResult = ReturnType<typeof useCreateHoldRequestV2Mutation>;
export type CreateHoldRequestV2MutationResult = Apollo.MutationResult<CreateHoldRequestV2Mutation>;
export type CreateHoldRequestV2MutationOptions = Apollo.BaseMutationOptions<CreateHoldRequestV2Mutation, CreateHoldRequestV2MutationVariables>;
export const DecideHoldRequestV2Document = gql`
    mutation DecideHoldRequestV2($requestId: Float!, $approve: Boolean!, $note: String) {
  DecideHoldRequestV2(request_id: $requestId, approve: $approve, note: $note) {
    code
    success
    message
  }
}
    `;
export type DecideHoldRequestV2MutationFn = Apollo.MutationFunction<DecideHoldRequestV2Mutation, DecideHoldRequestV2MutationVariables>;

/**
 * __useDecideHoldRequestV2Mutation__
 *
 * To run a mutation, you first call `useDecideHoldRequestV2Mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDecideHoldRequestV2Mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [decideHoldRequestV2Mutation, { data, loading, error }] = useDecideHoldRequestV2Mutation({
 *   variables: {
 *      requestId: // value for 'requestId'
 *      approve: // value for 'approve'
 *      note: // value for 'note'
 *   },
 * });
 */
export function useDecideHoldRequestV2Mutation(baseOptions?: Apollo.MutationHookOptions<DecideHoldRequestV2Mutation, DecideHoldRequestV2MutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DecideHoldRequestV2Mutation, DecideHoldRequestV2MutationVariables>(DecideHoldRequestV2Document, options);
      }
export type DecideHoldRequestV2MutationHookResult = ReturnType<typeof useDecideHoldRequestV2Mutation>;
export type DecideHoldRequestV2MutationResult = Apollo.MutationResult<DecideHoldRequestV2Mutation>;
export type DecideHoldRequestV2MutationOptions = Apollo.BaseMutationOptions<DecideHoldRequestV2Mutation, DecideHoldRequestV2MutationVariables>;
export const GetActiveHoldRequestV2Document = gql`
    query GetActiveHoldRequestV2($customerId: Float!) {
  GetActiveHoldRequestV2(customer_id: $customerId) {
    request_id
    status
    from_date
    to_date
    reason
  }
}
    `;

/**
 * __useGetActiveHoldRequestV2Query__
 *
 * To run a query within a React component, call `useGetActiveHoldRequestV2Query` and pass it any options that fit your needs.
 * When your component renders, `useGetActiveHoldRequestV2Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActiveHoldRequestV2Query({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetActiveHoldRequestV2Query(baseOptions: Apollo.QueryHookOptions<GetActiveHoldRequestV2Query, GetActiveHoldRequestV2QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetActiveHoldRequestV2Query, GetActiveHoldRequestV2QueryVariables>(GetActiveHoldRequestV2Document, options);
      }
export function useGetActiveHoldRequestV2LazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetActiveHoldRequestV2Query, GetActiveHoldRequestV2QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetActiveHoldRequestV2Query, GetActiveHoldRequestV2QueryVariables>(GetActiveHoldRequestV2Document, options);
        }
export type GetActiveHoldRequestV2QueryHookResult = ReturnType<typeof useGetActiveHoldRequestV2Query>;
export type GetActiveHoldRequestV2LazyQueryHookResult = ReturnType<typeof useGetActiveHoldRequestV2LazyQuery>;
export type GetActiveHoldRequestV2QueryResult = Apollo.QueryResult<GetActiveHoldRequestV2Query, GetActiveHoldRequestV2QueryVariables>;
export const GetHoldRequestDocument = gql`
    query GetHoldRequest($customerId: Float!) {
  GetHoldRequest(customer_id: $customerId) {
    from_date
    to_date
    process
    checker_status
  }
}
    `;

/**
 * __useGetHoldRequestQuery__
 *
 * To run a query within a React component, call `useGetHoldRequestQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHoldRequestQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHoldRequestQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetHoldRequestQuery(baseOptions: Apollo.QueryHookOptions<GetHoldRequestQuery, GetHoldRequestQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHoldRequestQuery, GetHoldRequestQueryVariables>(GetHoldRequestDocument, options);
      }
export function useGetHoldRequestLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHoldRequestQuery, GetHoldRequestQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHoldRequestQuery, GetHoldRequestQueryVariables>(GetHoldRequestDocument, options);
        }
export type GetHoldRequestQueryHookResult = ReturnType<typeof useGetHoldRequestQuery>;
export type GetHoldRequestLazyQueryHookResult = ReturnType<typeof useGetHoldRequestLazyQuery>;
export type GetHoldRequestQueryResult = Apollo.QueryResult<GetHoldRequestQuery, GetHoldRequestQueryVariables>;
export const GetHoldRequestByStatusDocument = gql`
    query GetHoldRequestByStatus($status: Float!) {
  GetHoldRequestByStatus(status: $status) {
    request_id
    request_by
    request_date
    customer_id
    reason
    from_date
    to_date
    old_end
    new_end
    checked_by
    checker_comment
    checked_date
    checker_status
    approved_by
    approver_comment
    approved_date
    approver_status
    process
    processed_by
  }
}
    `;

/**
 * __useGetHoldRequestByStatusQuery__
 *
 * To run a query within a React component, call `useGetHoldRequestByStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHoldRequestByStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHoldRequestByStatusQuery({
 *   variables: {
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetHoldRequestByStatusQuery(baseOptions: Apollo.QueryHookOptions<GetHoldRequestByStatusQuery, GetHoldRequestByStatusQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHoldRequestByStatusQuery, GetHoldRequestByStatusQueryVariables>(GetHoldRequestByStatusDocument, options);
      }
export function useGetHoldRequestByStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHoldRequestByStatusQuery, GetHoldRequestByStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHoldRequestByStatusQuery, GetHoldRequestByStatusQueryVariables>(GetHoldRequestByStatusDocument, options);
        }
export type GetHoldRequestByStatusQueryHookResult = ReturnType<typeof useGetHoldRequestByStatusQuery>;
export type GetHoldRequestByStatusLazyQueryHookResult = ReturnType<typeof useGetHoldRequestByStatusLazyQuery>;
export type GetHoldRequestByStatusQueryResult = Apollo.QueryResult<GetHoldRequestByStatusQuery, GetHoldRequestByStatusQueryVariables>;
export const HoldRequestsDocument = gql`
    query HoldRequests {
  HoldRequests {
    request_id
    request_by
    request_date
    customer_id
    reason
    from_date
    to_date
    old_end
    new_end
    checked_by
    checker_comment
    checked_date
    checker_status
    approved_by
    approver_comment
    approved_date
    approver_status
    display_name
    customer_name
    checker_name
    approved_name
    process
    processed_name
    processed_by
    phone
  }
}
    `;

/**
 * __useHoldRequestsQuery__
 *
 * To run a query within a React component, call `useHoldRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHoldRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHoldRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useHoldRequestsQuery(baseOptions?: Apollo.QueryHookOptions<HoldRequestsQuery, HoldRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HoldRequestsQuery, HoldRequestsQueryVariables>(HoldRequestsDocument, options);
      }
export function useHoldRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HoldRequestsQuery, HoldRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HoldRequestsQuery, HoldRequestsQueryVariables>(HoldRequestsDocument, options);
        }
export type HoldRequestsQueryHookResult = ReturnType<typeof useHoldRequestsQuery>;
export type HoldRequestsLazyQueryHookResult = ReturnType<typeof useHoldRequestsLazyQuery>;
export type HoldRequestsQueryResult = Apollo.QueryResult<HoldRequestsQuery, HoldRequestsQueryVariables>;
export const HoldRequestsV2Document = gql`
    query HoldRequestsV2 {
  HoldRequestsV2 {
    request_id
    customer_id
    customer_name
    phone
    requested_by
    requested_by_name
    requested_at
    reason
    from_date
    to_date
    status
    decided_by
    decided_by_name
    decided_at
    decision_note
    processed_by
    processed_by_name
    processed_at
    old_end
    new_end
    fee
    legacy
  }
}
    `;

/**
 * __useHoldRequestsV2Query__
 *
 * To run a query within a React component, call `useHoldRequestsV2Query` and pass it any options that fit your needs.
 * When your component renders, `useHoldRequestsV2Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHoldRequestsV2Query({
 *   variables: {
 *   },
 * });
 */
export function useHoldRequestsV2Query(baseOptions?: Apollo.QueryHookOptions<HoldRequestsV2Query, HoldRequestsV2QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HoldRequestsV2Query, HoldRequestsV2QueryVariables>(HoldRequestsV2Document, options);
      }
export function useHoldRequestsV2LazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HoldRequestsV2Query, HoldRequestsV2QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HoldRequestsV2Query, HoldRequestsV2QueryVariables>(HoldRequestsV2Document, options);
        }
export type HoldRequestsV2QueryHookResult = ReturnType<typeof useHoldRequestsV2Query>;
export type HoldRequestsV2LazyQueryHookResult = ReturnType<typeof useHoldRequestsV2LazyQuery>;
export type HoldRequestsV2QueryResult = Apollo.QueryResult<HoldRequestsV2Query, HoldRequestsV2QueryVariables>;
export const ProcessHoldV2Document = gql`
    mutation ProcessHoldV2($requestId: Float!, $fee: Float) {
  ProcessHoldV2(request_id: $requestId, fee: $fee) {
    code
    success
    message
    new_end
  }
}
    `;
export type ProcessHoldV2MutationFn = Apollo.MutationFunction<ProcessHoldV2Mutation, ProcessHoldV2MutationVariables>;

/**
 * __useProcessHoldV2Mutation__
 *
 * To run a mutation, you first call `useProcessHoldV2Mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useProcessHoldV2Mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [processHoldV2Mutation, { data, loading, error }] = useProcessHoldV2Mutation({
 *   variables: {
 *      requestId: // value for 'requestId'
 *      fee: // value for 'fee'
 *   },
 * });
 */
export function useProcessHoldV2Mutation(baseOptions?: Apollo.MutationHookOptions<ProcessHoldV2Mutation, ProcessHoldV2MutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ProcessHoldV2Mutation, ProcessHoldV2MutationVariables>(ProcessHoldV2Document, options);
      }
export type ProcessHoldV2MutationHookResult = ReturnType<typeof useProcessHoldV2Mutation>;
export type ProcessHoldV2MutationResult = Apollo.MutationResult<ProcessHoldV2Mutation>;
export type ProcessHoldV2MutationOptions = Apollo.BaseMutationOptions<ProcessHoldV2Mutation, ProcessHoldV2MutationVariables>;
export const GetMemberPaymentDetailDocument = gql`
    query GetMemberPaymentDetail($dateTo: String!, $dateFrom: String!) {
  GetMemberPaymentDetail(dateTo: $dateTo, dateFrom: $dateFrom) {
    price
    promotion
    customer_name
  }
}
    `;

/**
 * __useGetMemberPaymentDetailQuery__
 *
 * To run a query within a React component, call `useGetMemberPaymentDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMemberPaymentDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMemberPaymentDetailQuery({
 *   variables: {
 *      dateTo: // value for 'dateTo'
 *      dateFrom: // value for 'dateFrom'
 *   },
 * });
 */
export function useGetMemberPaymentDetailQuery(baseOptions: Apollo.QueryHookOptions<GetMemberPaymentDetailQuery, GetMemberPaymentDetailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMemberPaymentDetailQuery, GetMemberPaymentDetailQueryVariables>(GetMemberPaymentDetailDocument, options);
      }
export function useGetMemberPaymentDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMemberPaymentDetailQuery, GetMemberPaymentDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMemberPaymentDetailQuery, GetMemberPaymentDetailQueryVariables>(GetMemberPaymentDetailDocument, options);
        }
export type GetMemberPaymentDetailQueryHookResult = ReturnType<typeof useGetMemberPaymentDetailQuery>;
export type GetMemberPaymentDetailLazyQueryHookResult = ReturnType<typeof useGetMemberPaymentDetailLazyQuery>;
export type GetMemberPaymentDetailQueryResult = Apollo.QueryResult<GetMemberPaymentDetailQuery, GetMemberPaymentDetailQueryVariables>;
export const LoginDocument = gql`
    mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    code
    success
    message
    user {
      display_name
      role
      user_id
    }
    accessToken
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      loginInput: // value for 'loginInput'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const CreateCustomerPaymentDocument = gql`
    mutation CreateCustomerPayment($monthQty: Float!, $shift: String!, $startDate: String!, $newEnd: String!, $oldEnd: String!, $price: Float!, $promotion: String!, $customerId: Float!, $userId: Float!) {
  CreateCustomerPayment(
    month_qty: $monthQty
    shift: $shift
    start_date: $startDate
    new_end: $newEnd
    old_end: $oldEnd
    price: $price
    promotion: $promotion
    customer_id: $customerId
    user_id: $userId
  ) {
    payment_id
    code
    success
    message
  }
}
    `;
export type CreateCustomerPaymentMutationFn = Apollo.MutationFunction<CreateCustomerPaymentMutation, CreateCustomerPaymentMutationVariables>;

/**
 * __useCreateCustomerPaymentMutation__
 *
 * To run a mutation, you first call `useCreateCustomerPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCustomerPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCustomerPaymentMutation, { data, loading, error }] = useCreateCustomerPaymentMutation({
 *   variables: {
 *      monthQty: // value for 'monthQty'
 *      shift: // value for 'shift'
 *      startDate: // value for 'startDate'
 *      newEnd: // value for 'newEnd'
 *      oldEnd: // value for 'oldEnd'
 *      price: // value for 'price'
 *      promotion: // value for 'promotion'
 *      customerId: // value for 'customerId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateCustomerPaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateCustomerPaymentMutation, CreateCustomerPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCustomerPaymentMutation, CreateCustomerPaymentMutationVariables>(CreateCustomerPaymentDocument, options);
      }
export type CreateCustomerPaymentMutationHookResult = ReturnType<typeof useCreateCustomerPaymentMutation>;
export type CreateCustomerPaymentMutationResult = Apollo.MutationResult<CreateCustomerPaymentMutation>;
export type CreateCustomerPaymentMutationOptions = Apollo.BaseMutationOptions<CreateCustomerPaymentMutation, CreateCustomerPaymentMutationVariables>;
export const GetMemberPaymentDocument = gql`
    query GetMemberPayment($customerId: Float!) {
  GetMemberPayment(customer_id: $customerId) {
    payment_id
    payment_date
    user_id
    customer_id
    promotion
    price
    start_date
    old_end
    new_end
    shift
    month_qty
  }
}
    `;

/**
 * __useGetMemberPaymentQuery__
 *
 * To run a query within a React component, call `useGetMemberPaymentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMemberPaymentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMemberPaymentQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetMemberPaymentQuery(baseOptions: Apollo.QueryHookOptions<GetMemberPaymentQuery, GetMemberPaymentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMemberPaymentQuery, GetMemberPaymentQueryVariables>(GetMemberPaymentDocument, options);
      }
export function useGetMemberPaymentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMemberPaymentQuery, GetMemberPaymentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMemberPaymentQuery, GetMemberPaymentQueryVariables>(GetMemberPaymentDocument, options);
        }
export type GetMemberPaymentQueryHookResult = ReturnType<typeof useGetMemberPaymentQuery>;
export type GetMemberPaymentLazyQueryHookResult = ReturnType<typeof useGetMemberPaymentLazyQuery>;
export type GetMemberPaymentQueryResult = Apollo.QueryResult<GetMemberPaymentQuery, GetMemberPaymentQueryVariables>;
export const MemberPaymentDetailDocument = gql`
    query MemberPaymentDetail($paymentId: Float!) {
  MemberPaymentDetail(payment_id: $paymentId) {
    payment_id
    payment_date
    display_name
    customer_name
    phone
    promotion
    price
    old_end
    new_end
  }
}
    `;

/**
 * __useMemberPaymentDetailQuery__
 *
 * To run a query within a React component, call `useMemberPaymentDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useMemberPaymentDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMemberPaymentDetailQuery({
 *   variables: {
 *      paymentId: // value for 'paymentId'
 *   },
 * });
 */
export function useMemberPaymentDetailQuery(baseOptions: Apollo.QueryHookOptions<MemberPaymentDetailQuery, MemberPaymentDetailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MemberPaymentDetailQuery, MemberPaymentDetailQueryVariables>(MemberPaymentDetailDocument, options);
      }
export function useMemberPaymentDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MemberPaymentDetailQuery, MemberPaymentDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MemberPaymentDetailQuery, MemberPaymentDetailQueryVariables>(MemberPaymentDetailDocument, options);
        }
export type MemberPaymentDetailQueryHookResult = ReturnType<typeof useMemberPaymentDetailQuery>;
export type MemberPaymentDetailLazyQueryHookResult = ReturnType<typeof useMemberPaymentDetailLazyQuery>;
export type MemberPaymentDetailQueryResult = Apollo.QueryResult<MemberPaymentDetailQuery, MemberPaymentDetailQueryVariables>;
export const CreateTicketPaymentDocument = gql`
    mutation CreateTicketPayment($ticketCode: String!, $price: Float!, $userId: Float!) {
  CreateTicketPayment(ticket_code: $ticketCode, price: $price, user_id: $userId) {
    payment_id
    code
    success
    message
  }
}
    `;
export type CreateTicketPaymentMutationFn = Apollo.MutationFunction<CreateTicketPaymentMutation, CreateTicketPaymentMutationVariables>;

/**
 * __useCreateTicketPaymentMutation__
 *
 * To run a mutation, you first call `useCreateTicketPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTicketPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTicketPaymentMutation, { data, loading, error }] = useCreateTicketPaymentMutation({
 *   variables: {
 *      ticketCode: // value for 'ticketCode'
 *      price: // value for 'price'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateTicketPaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateTicketPaymentMutation, CreateTicketPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTicketPaymentMutation, CreateTicketPaymentMutationVariables>(CreateTicketPaymentDocument, options);
      }
export type CreateTicketPaymentMutationHookResult = ReturnType<typeof useCreateTicketPaymentMutation>;
export type CreateTicketPaymentMutationResult = Apollo.MutationResult<CreateTicketPaymentMutation>;
export type CreateTicketPaymentMutationOptions = Apollo.BaseMutationOptions<CreateTicketPaymentMutation, CreateTicketPaymentMutationVariables>;
export const GetTicketPriceConfigsDocument = gql`
    query GetTicketPriceConfigs {
  GetTicketPriceConfigs {
    config_id
    price
    label
    age_group
    key_image
    facilities {
      facility_id
      name
      code
    }
  }
}
    `;

/**
 * __useGetTicketPriceConfigsQuery__
 *
 * To run a query within a React component, call `useGetTicketPriceConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTicketPriceConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTicketPriceConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTicketPriceConfigsQuery(baseOptions?: Apollo.QueryHookOptions<GetTicketPriceConfigsQuery, GetTicketPriceConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTicketPriceConfigsQuery, GetTicketPriceConfigsQueryVariables>(GetTicketPriceConfigsDocument, options);
      }
export function useGetTicketPriceConfigsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTicketPriceConfigsQuery, GetTicketPriceConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTicketPriceConfigsQuery, GetTicketPriceConfigsQueryVariables>(GetTicketPriceConfigsDocument, options);
        }
export type GetTicketPriceConfigsQueryHookResult = ReturnType<typeof useGetTicketPriceConfigsQuery>;
export type GetTicketPriceConfigsLazyQueryHookResult = ReturnType<typeof useGetTicketPriceConfigsLazyQuery>;
export type GetTicketPriceConfigsQueryResult = Apollo.QueryResult<GetTicketPriceConfigsQuery, GetTicketPriceConfigsQueryVariables>;
export const UpsertTicketPriceConfigDocument = gql`
    mutation UpsertTicketPriceConfig($price: Float!, $facility_ids: [Float!]!, $label: String, $key_image: String, $age_group: String) {
  UpsertTicketPriceConfig(
    price: $price
    facility_ids: $facility_ids
    label: $label
    key_image: $key_image
    age_group: $age_group
  ) {
    config_id
    price
    label
    age_group
    key_image
    facilities {
      facility_id
      name
      code
    }
  }
}
    `;
export type UpsertTicketPriceConfigMutationFn = Apollo.MutationFunction<UpsertTicketPriceConfigMutation, UpsertTicketPriceConfigMutationVariables>;

/**
 * __useUpsertTicketPriceConfigMutation__
 *
 * To run a mutation, you first call `useUpsertTicketPriceConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertTicketPriceConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertTicketPriceConfigMutation, { data, loading, error }] = useUpsertTicketPriceConfigMutation({
 *   variables: {
 *      price: // value for 'price'
 *      facility_ids: // value for 'facility_ids'
 *      label: // value for 'label'
 *      key_image: // value for 'key_image'
 *      age_group: // value for 'age_group'
 *   },
 * });
 */
export function useUpsertTicketPriceConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpsertTicketPriceConfigMutation, UpsertTicketPriceConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertTicketPriceConfigMutation, UpsertTicketPriceConfigMutationVariables>(UpsertTicketPriceConfigDocument, options);
      }
export type UpsertTicketPriceConfigMutationHookResult = ReturnType<typeof useUpsertTicketPriceConfigMutation>;
export type UpsertTicketPriceConfigMutationResult = Apollo.MutationResult<UpsertTicketPriceConfigMutation>;
export type UpsertTicketPriceConfigMutationOptions = Apollo.BaseMutationOptions<UpsertTicketPriceConfigMutation, UpsertTicketPriceConfigMutationVariables>;
export const DeleteTicketPriceConfigDocument = gql`
    mutation DeleteTicketPriceConfig($config_id: Float!) {
  DeleteTicketPriceConfig(config_id: $config_id)
}
    `;
export type DeleteTicketPriceConfigMutationFn = Apollo.MutationFunction<DeleteTicketPriceConfigMutation, DeleteTicketPriceConfigMutationVariables>;

/**
 * __useDeleteTicketPriceConfigMutation__
 *
 * To run a mutation, you first call `useDeleteTicketPriceConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTicketPriceConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTicketPriceConfigMutation, { data, loading, error }] = useDeleteTicketPriceConfigMutation({
 *   variables: {
 *      config_id: // value for 'config_id'
 *   },
 * });
 */
export function useDeleteTicketPriceConfigMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTicketPriceConfigMutation, DeleteTicketPriceConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTicketPriceConfigMutation, DeleteTicketPriceConfigMutationVariables>(DeleteTicketPriceConfigDocument, options);
      }
export type DeleteTicketPriceConfigMutationHookResult = ReturnType<typeof useDeleteTicketPriceConfigMutation>;
export type DeleteTicketPriceConfigMutationResult = Apollo.MutationResult<DeleteTicketPriceConfigMutation>;
export type DeleteTicketPriceConfigMutationOptions = Apollo.BaseMutationOptions<DeleteTicketPriceConfigMutation, DeleteTicketPriceConfigMutationVariables>;
export const CreateTrainningPaymentDocument = gql`
    mutation CreateTrainningPayment($type: String!, $price: Float!, $promotion: String!, $customerId: Float!, $userId: Float!) {
  CreateTrainningPayment(
    type: $type
    price: $price
    promotion: $promotion
    customer_id: $customerId
    user_id: $userId
  ) {
    payment_id
    code
    success
    message
  }
}
    `;
export type CreateTrainningPaymentMutationFn = Apollo.MutationFunction<CreateTrainningPaymentMutation, CreateTrainningPaymentMutationVariables>;

/**
 * __useCreateTrainningPaymentMutation__
 *
 * To run a mutation, you first call `useCreateTrainningPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTrainningPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTrainningPaymentMutation, { data, loading, error }] = useCreateTrainningPaymentMutation({
 *   variables: {
 *      type: // value for 'type'
 *      price: // value for 'price'
 *      promotion: // value for 'promotion'
 *      customerId: // value for 'customerId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateTrainningPaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateTrainningPaymentMutation, CreateTrainningPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTrainningPaymentMutation, CreateTrainningPaymentMutationVariables>(CreateTrainningPaymentDocument, options);
      }
export type CreateTrainningPaymentMutationHookResult = ReturnType<typeof useCreateTrainningPaymentMutation>;
export type CreateTrainningPaymentMutationResult = Apollo.MutationResult<CreateTrainningPaymentMutation>;
export type CreateTrainningPaymentMutationOptions = Apollo.BaseMutationOptions<CreateTrainningPaymentMutation, CreateTrainningPaymentMutationVariables>;
export const GetTrainningPaymentDocument = gql`
    query GetTrainningPayment($customerId: Float!) {
  GetTrainningPayment(customer_id: $customerId) {
    payment_id
    payment_date
    user_id
    customer_id
    type
    promotion
    price
  }
}
    `;

/**
 * __useGetTrainningPaymentQuery__
 *
 * To run a query within a React component, call `useGetTrainningPaymentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTrainningPaymentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTrainningPaymentQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetTrainningPaymentQuery(baseOptions: Apollo.QueryHookOptions<GetTrainningPaymentQuery, GetTrainningPaymentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTrainningPaymentQuery, GetTrainningPaymentQueryVariables>(GetTrainningPaymentDocument, options);
      }
export function useGetTrainningPaymentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTrainningPaymentQuery, GetTrainningPaymentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTrainningPaymentQuery, GetTrainningPaymentQueryVariables>(GetTrainningPaymentDocument, options);
        }
export type GetTrainningPaymentQueryHookResult = ReturnType<typeof useGetTrainningPaymentQuery>;
export type GetTrainningPaymentLazyQueryHookResult = ReturnType<typeof useGetTrainningPaymentLazyQuery>;
export type GetTrainningPaymentQueryResult = Apollo.QueryResult<GetTrainningPaymentQuery, GetTrainningPaymentQueryVariables>;
export const GetTranningPriceDocument = gql`
    query GetTranningPrice {
  GetTranningPrice {
    id
    name
    type
    month_qty
    price
  }
}
    `;

/**
 * __useGetTranningPriceQuery__
 *
 * To run a query within a React component, call `useGetTranningPriceQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTranningPriceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTranningPriceQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTranningPriceQuery(baseOptions?: Apollo.QueryHookOptions<GetTranningPriceQuery, GetTranningPriceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTranningPriceQuery, GetTranningPriceQueryVariables>(GetTranningPriceDocument, options);
      }
export function useGetTranningPriceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTranningPriceQuery, GetTranningPriceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTranningPriceQuery, GetTranningPriceQueryVariables>(GetTranningPriceDocument, options);
        }
export type GetTranningPriceQueryHookResult = ReturnType<typeof useGetTranningPriceQuery>;
export type GetTranningPriceLazyQueryHookResult = ReturnType<typeof useGetTranningPriceLazyQuery>;
export type GetTranningPriceQueryResult = Apollo.QueryResult<GetTranningPriceQuery, GetTranningPriceQueryVariables>;
export const ApproveTransferRequestDocument = gql`
    mutation ApproveTransferRequest($approverStatus: ApprovalStatus!, $approverComment: String!, $requestId: Float!) {
  ApproveTransferRequest(
    approver_status: $approverStatus
    approver_comment: $approverComment
    request_id: $requestId
  ) {
    code
    success
    message
  }
}
    `;
export type ApproveTransferRequestMutationFn = Apollo.MutationFunction<ApproveTransferRequestMutation, ApproveTransferRequestMutationVariables>;

/**
 * __useApproveTransferRequestMutation__
 *
 * To run a mutation, you first call `useApproveTransferRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveTransferRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveTransferRequestMutation, { data, loading, error }] = useApproveTransferRequestMutation({
 *   variables: {
 *      approverStatus: // value for 'approverStatus'
 *      approverComment: // value for 'approverComment'
 *      requestId: // value for 'requestId'
 *   },
 * });
 */
export function useApproveTransferRequestMutation(baseOptions?: Apollo.MutationHookOptions<ApproveTransferRequestMutation, ApproveTransferRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveTransferRequestMutation, ApproveTransferRequestMutationVariables>(ApproveTransferRequestDocument, options);
      }
export type ApproveTransferRequestMutationHookResult = ReturnType<typeof useApproveTransferRequestMutation>;
export type ApproveTransferRequestMutationResult = Apollo.MutationResult<ApproveTransferRequestMutation>;
export type ApproveTransferRequestMutationOptions = Apollo.BaseMutationOptions<ApproveTransferRequestMutation, ApproveTransferRequestMutationVariables>;
export const CheckTransferRequestDocument = gql`
    mutation CheckTransferRequest($checkerStatus: ApprovalStatus!, $checkerComment: String!, $requestId: Float!) {
  CheckTransferRequest(
    checker_status: $checkerStatus
    checker_comment: $checkerComment
    request_id: $requestId
  ) {
    code
    success
    message
  }
}
    `;
export type CheckTransferRequestMutationFn = Apollo.MutationFunction<CheckTransferRequestMutation, CheckTransferRequestMutationVariables>;

/**
 * __useCheckTransferRequestMutation__
 *
 * To run a mutation, you first call `useCheckTransferRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCheckTransferRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [checkTransferRequestMutation, { data, loading, error }] = useCheckTransferRequestMutation({
 *   variables: {
 *      checkerStatus: // value for 'checkerStatus'
 *      checkerComment: // value for 'checkerComment'
 *      requestId: // value for 'requestId'
 *   },
 * });
 */
export function useCheckTransferRequestMutation(baseOptions?: Apollo.MutationHookOptions<CheckTransferRequestMutation, CheckTransferRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CheckTransferRequestMutation, CheckTransferRequestMutationVariables>(CheckTransferRequestDocument, options);
      }
export type CheckTransferRequestMutationHookResult = ReturnType<typeof useCheckTransferRequestMutation>;
export type CheckTransferRequestMutationResult = Apollo.MutationResult<CheckTransferRequestMutation>;
export type CheckTransferRequestMutationOptions = Apollo.BaseMutationOptions<CheckTransferRequestMutation, CheckTransferRequestMutationVariables>;
export const CreateTransferDocument = gql`
    mutation CreateTransfer($requestId: Float!, $fee: Float) {
  CreateTransfer(request_id: $requestId, fee: $fee) {
    code
    success
    message
    transfer_id
  }
}
    `;
export type CreateTransferMutationFn = Apollo.MutationFunction<CreateTransferMutation, CreateTransferMutationVariables>;

/**
 * __useCreateTransferMutation__
 *
 * To run a mutation, you first call `useCreateTransferMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTransferMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTransferMutation, { data, loading, error }] = useCreateTransferMutation({
 *   variables: {
 *      requestId: // value for 'requestId'
 *      fee: // value for 'fee'
 *   },
 * });
 */
export function useCreateTransferMutation(baseOptions?: Apollo.MutationHookOptions<CreateTransferMutation, CreateTransferMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTransferMutation, CreateTransferMutationVariables>(CreateTransferDocument, options);
      }
export type CreateTransferMutationHookResult = ReturnType<typeof useCreateTransferMutation>;
export type CreateTransferMutationResult = Apollo.MutationResult<CreateTransferMutation>;
export type CreateTransferMutationOptions = Apollo.BaseMutationOptions<CreateTransferMutation, CreateTransferMutationVariables>;
export const CreateTransferRequestDocument = gql`
    mutation CreateTransferRequest($reason: String!, $receiverId: Float!, $senderId: Float!) {
  CreateTransferRequest(
    reason: $reason
    receiver_id: $receiverId
    sender_id: $senderId
  ) {
    code
    success
    message
  }
}
    `;
export type CreateTransferRequestMutationFn = Apollo.MutationFunction<CreateTransferRequestMutation, CreateTransferRequestMutationVariables>;

/**
 * __useCreateTransferRequestMutation__
 *
 * To run a mutation, you first call `useCreateTransferRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTransferRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTransferRequestMutation, { data, loading, error }] = useCreateTransferRequestMutation({
 *   variables: {
 *      reason: // value for 'reason'
 *      receiverId: // value for 'receiverId'
 *      senderId: // value for 'senderId'
 *   },
 * });
 */
export function useCreateTransferRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateTransferRequestMutation, CreateTransferRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTransferRequestMutation, CreateTransferRequestMutationVariables>(CreateTransferRequestDocument, options);
      }
export type CreateTransferRequestMutationHookResult = ReturnType<typeof useCreateTransferRequestMutation>;
export type CreateTransferRequestMutationResult = Apollo.MutationResult<CreateTransferRequestMutation>;
export type CreateTransferRequestMutationOptions = Apollo.BaseMutationOptions<CreateTransferRequestMutation, CreateTransferRequestMutationVariables>;
export const TransferRequestsDocument = gql`
    query TransferRequests {
  TransferRequests {
    request_id
    request_by
    request_date
    reason
    sender_id
    receiver_id
    checked_by
    checker_comment
    checked_date
    checker_status
    approved_by
    approver_comment
    approved_date
    approver_status
    process
    processed_by
    processed_date
    display_name
    sender_name
    sender_phone
    receiver_name
    receiver_phone
    checker_name
    processed_name
    approver_name
    receiver_old_end
    sender_old_end
  }
}
    `;

/**
 * __useTransferRequestsQuery__
 *
 * To run a query within a React component, call `useTransferRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTransferRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTransferRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useTransferRequestsQuery(baseOptions?: Apollo.QueryHookOptions<TransferRequestsQuery, TransferRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TransferRequestsQuery, TransferRequestsQueryVariables>(TransferRequestsDocument, options);
      }
export function useTransferRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TransferRequestsQuery, TransferRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TransferRequestsQuery, TransferRequestsQueryVariables>(TransferRequestsDocument, options);
        }
export type TransferRequestsQueryHookResult = ReturnType<typeof useTransferRequestsQuery>;
export type TransferRequestsLazyQueryHookResult = ReturnType<typeof useTransferRequestsLazyQuery>;
export type TransferRequestsQueryResult = Apollo.QueryResult<TransferRequestsQuery, TransferRequestsQueryVariables>;