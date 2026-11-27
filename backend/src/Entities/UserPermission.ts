import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

/** One per-user exception to the user's role defaults — see
 *  Utils/permissionCatalog.ts. allowed = 1 grants, allowed = 0 revokes. */
@Entity("user_permission")
export class UserPermission extends BaseEntity {
  @PrimaryColumn("int")
  user_id!: number;

  @PrimaryColumn({ type: "varchar", length: 64 })
  permission!: string;

  @Column({ type: "tinyint" })
  allowed!: number;
}
