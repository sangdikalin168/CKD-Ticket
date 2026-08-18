import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export class Users extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  user_id!: number;

  @Field()
  @Column()
  display_name!: string;

  @Field()
  @Column({ unique: true })
  phone!: string;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Field()
  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  created_at!: string;

  @Field()
  @Column()
  role!: string;

  @Field()
  @Column({ default: "https://randomuser.me/api/portraits/men/91.jpg" })
  image!: string;

  @Column("int", { default: 0 })
  tokenVersion!: number;

  // Soft delete. Users are referenced by FK from hold_request_v2 (and by id
  // throughout historical rows), so they are deactivated, never deleted —
  // hard deletes are what orphaned 60% of the v1 hold audit trail.
  @Field()
  @Column({ type: "tinyint", default: 1 })
  is_active!: number;
}
