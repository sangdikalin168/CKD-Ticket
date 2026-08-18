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

export type HoldRequestsV2QueryVariables = Exact<{ [key: string]: never; }>;


export type HoldRequestsV2Query = { __typename?: 'Query', HoldRequestsV2: Array<{ __typename?: 'HoldRequestV2Row', request_id: number, customer_id: number, customer_name: string, phone: string, requested_by: number, requested_by_name?: string | null, requested_at: string, reason: string, from_date: string, to_date: string, status: string, decided_by?: number | null, decided_by_name?: string | null, decided_at?: string | null, decision_note?: string | null, processed_by?: number | null, processed_by_name?: string | null, processed_at?: string | null, old_end?: string | null, new_end?: string | null, fee: string, legacy: number }> };

export type ProcessHoldV2MutationVariables = Exact<{
  requestId: Scalars['Float'];
  fee?: InputMaybe<Scalars['Float']>;
}>;


export type ProcessHoldV2Mutation = { __typename?: 'Mutation', ProcessHoldV2: { __typename?: 'HoldV2Response', code: number, success: boolean, message?: string | null, new_end?: string | null } };


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