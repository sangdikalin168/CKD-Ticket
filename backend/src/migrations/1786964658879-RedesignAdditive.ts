import { MigrationInterface, QueryRunner } from "typeorm";

export class RedesignAdditive1786964658879 implements MigrationInterface {
    name = 'RedesignAdditive1786964658879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`facility\` (
                \`facility_id\` int NOT NULL AUTO_INCREMENT,
                \`code\` varchar(30) NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`requires_door_access\` tinyint NOT NULL DEFAULT 0,
                UNIQUE INDEX \`IDX_1f0d0a085d82741259b8f88f21\` (\`code\`),
                PRIMARY KEY (\`facility_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`package\` (
                \`package_id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(150) NOT NULL,
                \`product_type\` enum (
                    'MEMBERSHIP',
                    'TICKET',
                    'COUPON',
                    'TRAINING',
                    'FRUIT'
                ) NOT NULL,
                \`access_model\` enum ('TIME', 'COUNT') NOT NULL,
                \`price\` decimal(10, 2) NOT NULL,
                \`duration_months\` decimal(5, 2) NULL,
                \`entry_count\` int NULL,
                \`grants_door_access\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE INDEX \`IDX_d7bc40d7a9962bb58fbad24e23\` (\`product_type\`, \`price\`, \`duration_months\`),
                PRIMARY KEY (\`package_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`package_facility\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`package_id\` int NOT NULL,
                \`facility_id\` int NOT NULL,
                UNIQUE INDEX \`IDX_99f6acc9fbe4a9b92776538996\` (\`package_id\`, \`facility_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`purchase\` (
                \`purchase_id\` int NOT NULL AUTO_INCREMENT,
                \`purchase_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`customer_id\` int NULL,
                \`package_id\` int NOT NULL,
                \`entitlement_id\` int NULL,
                \`sold_by\` int NOT NULL,
                \`price_paid\` decimal(10, 2) NOT NULL,
                \`discount_amount\` decimal(10, 2) NOT NULL DEFAULT '0.00',
                \`promotion\` varchar(100) NULL,
                \`payment_method\` enum ('CASH', 'CARD', 'TRANSFER', 'OTHER') NULL,
                \`shift\` enum ('Full', 'Morning') NULL,
                \`applies_from\` date NULL,
                \`applies_until\` date NULL,
                \`previous_valid_until\` date NULL,
                \`entries_added\` int NULL,
                \`note\` varchar(255) NULL,
                INDEX \`IDX_a553d3aa02f37f28b2808efa3a\` (\`purchase_date\`),
                INDEX \`IDX_2248a331258d17d204ccfe9497\` (\`customer_id\`),
                INDEX \`IDX_ccf6154b551c1351f235c67159\` (\`package_id\`),
                INDEX \`IDX_1557ce984b27aa1b2ed4e903e7\` (\`entitlement_id\`),
                PRIMARY KEY (\`purchase_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`entitlement\` (
                \`entitlement_id\` int NOT NULL AUTO_INCREMENT,
                \`customer_id\` int NULL,
                \`package_id\` int NOT NULL,
                \`product_type\` enum (
                    'MEMBERSHIP',
                    'TICKET',
                    'COUPON',
                    'TRAINING',
                    'FRUIT'
                ) NOT NULL,
                \`access_model\` enum ('TIME', 'COUNT') NOT NULL,
                \`shift\` enum ('Full', 'Morning') NOT NULL DEFAULT 'Full',
                \`valid_from\` date NULL,
                \`valid_until\` date NULL,
                \`entries_total\` int NULL,
                \`entries_used\` int NOT NULL DEFAULT '0',
                \`access_code\` varchar(64) NULL,
                \`status\` enum (
                    'ACTIVE',
                    'EXPIRED',
                    'USED_UP',
                    'ON_HOLD',
                    'TRANSFERRED',
                    'CANCELLED'
                ) NOT NULL DEFAULT 'ACTIVE',
                \`origin_purchase_id\` int NULL,
                \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX \`IDX_b90dd4440cb533c5296002cf59\` (\`customer_id\`),
                INDEX \`IDX_13a1e951baa177f948e7a9adf6\` (\`package_id\`),
                INDEX \`IDX_b46a44c7b26fd018c05a4eacdf\` (\`valid_until\`),
                UNIQUE INDEX \`IDX_b768bdb5ae9f7af0c4ac3f6cbf\` (\`access_code\`),
                INDEX \`IDX_87dad2bba6d2af1326e682a8a7\` (\`status\`),
                PRIMARY KEY (\`entitlement_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`check_in\` (
                \`check_in_id\` int NOT NULL AUTO_INCREMENT,
                \`check_in_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`customer_id\` int NULL,
                \`entitlement_id\` int NULL,
                \`facility_id\` int NULL,
                \`access_method\` enum ('RFID', 'FINGERPRINT', 'MANUAL', 'CODE') NOT NULL DEFAULT 'MANUAL',
                \`recorded_by\` int NULL,
                \`note\` varchar(255) NULL,
                \`key_taken\` tinyint NOT NULL DEFAULT 0,
                \`towel_taken\` tinyint NOT NULL DEFAULT 0,
                INDEX \`IDX_9cfb08e0d5f8e52359f098d51d\` (\`check_in_time\`),
                INDEX \`IDX_73df8958ae4dd7dd79bd66cbc9\` (\`customer_id\`),
                INDEX \`IDX_9d2aba7efd5d6c9526701d6300\` (\`entitlement_id\`),
                PRIMARY KEY (\`check_in_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`ticket_price_config\` (
                \`config_id\` int NOT NULL AUTO_INCREMENT,
                \`price\` float NOT NULL,
                \`label\` varchar(100) NULL,
                \`age_group\` varchar(50) NULL,
                \`key_image\` longtext NULL,
                UNIQUE INDEX \`IDX_8cbed2048cd906e90fea288935\` (\`price\`),
                PRIMARY KEY (\`config_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`member_price_facility\` (
                \`memberPriceTableId\` int NOT NULL,
                \`facilityFacilityId\` int NOT NULL,
                INDEX \`IDX_3ebf9343374a974424b30de080\` (\`memberPriceTableId\`),
                INDEX \`IDX_1c232bd48fe9ae1a8b3dc5eab6\` (\`facilityFacilityId\`),
                PRIMARY KEY (\`memberPriceTableId\`, \`facilityFacilityId\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`ticket_price_config_facility\` (
                \`ticketPriceConfigConfigId\` int NOT NULL,
                \`facilityFacilityId\` int NOT NULL,
                INDEX \`IDX_6aa255535cebef7bbc0e76f6f5\` (\`ticketPriceConfigConfigId\`),
                INDEX \`IDX_8a75c0c0c4501557ddcf88c7f8\` (\`facilityFacilityId\`),
                PRIMARY KEY (
                    \`ticketPriceConfigConfigId\`,
                    \`facilityFacilityId\`
                )
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\`
            ADD \`rfid_uid\` varchar(64) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\`
            ADD \`date_of_birth\` date NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\`
            ADD \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\`
            ADD \`serviceType\` enum ('Swim', 'SwimGym', 'SwimSteam', 'SwimGymSteam') NOT NULL DEFAULT 'Swim'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\`
            ADD \`key_image\` longtext NULL
        `);
        // HAND-EDITED: the generator emitted DROP COLUMN + ADD for this date ->
        // datetime change, which would have discarded every user's created_at.
        // MODIFY widens the type in place and keeps the values (time -> 00:00:00).
        await queryRunner.query(`
            ALTER TABLE \`users\`
            MODIFY COLUMN \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`created_date\` \`created_date\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        // HAND-EDITED: the generator emitted DROP COLUMN + ADD for this
        // varchar(50) NOT NULL -> varchar(200) NULL change, which would have wiped
        // the profile photo path of all 3688 customers. MODIFY widens in place;
        // the longest existing value is 46 chars, so nothing truncates.
        await queryRunner.query(`
            ALTER TABLE \`customer\`
            MODIFY COLUMN \`image_path\` varchar(200) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`end_membership_date\` \`end_membership_date\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`end_fruit_date\` \`end_fruit_date\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold\` CHANGE \`hold_date\` \`hold_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`request_date\` \`request_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`checked_date\` \`checked_date\` datetime NOT NULL DEFAULT '2000-01-01'
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`approved_date\` \`approved_date\` datetime NOT NULL DEFAULT '2000-01-01'
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer\` CHANGE \`transfer_date\` \`transfer_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`request_date\` \`request_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`checked_date\` \`checked_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`approved_date\` \`approved_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_scan\` CHANGE \`date_time\` \`date_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\` CHANGE \`customerType\` \`customerType\` enum ('Full', 'Old', 'New') NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`start_date\` \`start_date\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`old_end\` \`old_end\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`new_end\` \`new_end\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_card\` CHANGE \`created_date\` \`created_date\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_payment\` CHANGE \`last_update\` \`last_update\` date NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`trainning_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`ticket_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`old_end\` \`old_end\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`new_end\` \`new_end\` date NOT NULL DEFAULT CURRENT_DATE
        `);
        await queryRunner.query(`
            ALTER TABLE \`package_facility\`
            ADD CONSTRAINT \`FK_4147c8909969fde9732c247552e\` FOREIGN KEY (\`package_id\`) REFERENCES \`package\`(\`package_id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`package_facility\`
            ADD CONSTRAINT \`FK_275aa064e4ba766c33b3edf9fd4\` FOREIGN KEY (\`facility_id\`) REFERENCES \`facility\`(\`facility_id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\`
            ADD CONSTRAINT \`FK_2248a331258d17d204ccfe9497c\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customer\`(\`customer_id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\`
            ADD CONSTRAINT \`FK_ccf6154b551c1351f235c671590\` FOREIGN KEY (\`package_id\`) REFERENCES \`package\`(\`package_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\`
            ADD CONSTRAINT \`FK_155207768692bd57fc853caa45f\` FOREIGN KEY (\`sold_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`entitlement\`
            ADD CONSTRAINT \`FK_b90dd4440cb533c5296002cf594\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customer\`(\`customer_id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`entitlement\`
            ADD CONSTRAINT \`FK_13a1e951baa177f948e7a9adf6f\` FOREIGN KEY (\`package_id\`) REFERENCES \`package\`(\`package_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\`
            ADD CONSTRAINT \`FK_73df8958ae4dd7dd79bd66cbc90\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customer\`(\`customer_id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\`
            ADD CONSTRAINT \`FK_9d2aba7efd5d6c9526701d6300b\` FOREIGN KEY (\`entitlement_id\`) REFERENCES \`entitlement\`(\`entitlement_id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\`
            ADD CONSTRAINT \`FK_6d8ab46fb7f83e9a478ff4c196c\` FOREIGN KEY (\`facility_id\`) REFERENCES \`facility\`(\`facility_id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_facility\`
            ADD CONSTRAINT \`FK_3ebf9343374a974424b30de0803\` FOREIGN KEY (\`memberPriceTableId\`) REFERENCES \`member_price_table\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_facility\`
            ADD CONSTRAINT \`FK_1c232bd48fe9ae1a8b3dc5eab6a\` FOREIGN KEY (\`facilityFacilityId\`) REFERENCES \`facility\`(\`facility_id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE \`ticket_price_config_facility\`
            ADD CONSTRAINT \`FK_6aa255535cebef7bbc0e76f6f57\` FOREIGN KEY (\`ticketPriceConfigConfigId\`) REFERENCES \`ticket_price_config\`(\`config_id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE \`ticket_price_config_facility\`
            ADD CONSTRAINT \`FK_8a75c0c0c4501557ddcf88c7f80\` FOREIGN KEY (\`facilityFacilityId\`) REFERENCES \`facility\`(\`facility_id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`ticket_price_config_facility\` DROP FOREIGN KEY \`FK_8a75c0c0c4501557ddcf88c7f80\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`ticket_price_config_facility\` DROP FOREIGN KEY \`FK_6aa255535cebef7bbc0e76f6f57\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_facility\` DROP FOREIGN KEY \`FK_1c232bd48fe9ae1a8b3dc5eab6a\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_facility\` DROP FOREIGN KEY \`FK_3ebf9343374a974424b30de0803\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\` DROP FOREIGN KEY \`FK_6d8ab46fb7f83e9a478ff4c196c\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\` DROP FOREIGN KEY \`FK_9d2aba7efd5d6c9526701d6300b\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`check_in\` DROP FOREIGN KEY \`FK_73df8958ae4dd7dd79bd66cbc90\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`entitlement\` DROP FOREIGN KEY \`FK_13a1e951baa177f948e7a9adf6f\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`entitlement\` DROP FOREIGN KEY \`FK_b90dd4440cb533c5296002cf594\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\` DROP FOREIGN KEY \`FK_155207768692bd57fc853caa45f\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\` DROP FOREIGN KEY \`FK_ccf6154b551c1351f235c671590\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`purchase\` DROP FOREIGN KEY \`FK_2248a331258d17d204ccfe9497c\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`package_facility\` DROP FOREIGN KEY \`FK_275aa064e4ba766c33b3edf9fd4\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`package_facility\` DROP FOREIGN KEY \`FK_4147c8909969fde9732c247552e\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`new_end\` \`new_end\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`old_end\` \`old_end\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`fruit_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`ticket_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`trainning_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_payment\` CHANGE \`last_update\` \`last_update\` date NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`coupon_card\` CHANGE \`created_date\` \`created_date\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`new_end\` \`new_end\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`old_end\` \`old_end\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`start_date\` \`start_date\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_payment\` CHANGE \`payment_date\` \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\` CHANGE \`customerType\` \`customerType\` enum ('Old', 'New') NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_scan\` CHANGE \`date_time\` \`date_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`approved_date\` \`approved_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`checked_date\` \`checked_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` CHANGE \`request_date\` \`request_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`transfer\` CHANGE \`transfer_date\` \`transfer_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`approved_date\` \`approved_date\` datetime NOT NULL DEFAULT '' 2000 -01 -01 00 :00 :00 ''
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`checked_date\` \`checked_date\` datetime NOT NULL DEFAULT '' 2000 -01 -01 00 :00 :00 ''
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold_request\` CHANGE \`request_date\` \`request_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`hold\` CHANGE \`hold_date\` \`hold_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`end_fruit_date\` \`end_fruit_date\` date NOT NULL DEFAULT 'curdate()'
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`end_membership_date\` \`end_membership_date\` date NOT NULL DEFAULT 'curdate()'
        `);
        // HAND-EDITED (see up()): MODIFY instead of DROP + ADD so a rollback keeps
        // the photo paths. Rows with a NULL image_path must be filled first, since
        // the original column was NOT NULL.
        await queryRunner.query(`
            ALTER TABLE \`customer\`
            MODIFY COLUMN \`image_path\` varchar(50) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` CHANGE \`created_date\` \`created_date\` date NOT NULL DEFAULT 'curdate()'
        `);
        // HAND-EDITED (see up()): MODIFY instead of DROP + ADD so a rollback keeps
        // the user creation dates.
        await queryRunner.query(`
            ALTER TABLE \`users\`
            MODIFY COLUMN \`created_at\` date NOT NULL DEFAULT CURRENT_TIMESTAMP()
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\` DROP COLUMN \`key_image\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`member_price_table\` DROP COLUMN \`serviceType\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` DROP COLUMN \`status\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` DROP COLUMN \`date_of_birth\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`customer\` DROP COLUMN \`rfid_uid\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_8a75c0c0c4501557ddcf88c7f8\` ON \`ticket_price_config_facility\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_6aa255535cebef7bbc0e76f6f5\` ON \`ticket_price_config_facility\`
        `);
        await queryRunner.query(`
            DROP TABLE \`ticket_price_config_facility\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_1c232bd48fe9ae1a8b3dc5eab6\` ON \`member_price_facility\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_3ebf9343374a974424b30de080\` ON \`member_price_facility\`
        `);
        await queryRunner.query(`
            DROP TABLE \`member_price_facility\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_8cbed2048cd906e90fea288935\` ON \`ticket_price_config\`
        `);
        await queryRunner.query(`
            DROP TABLE \`ticket_price_config\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_9d2aba7efd5d6c9526701d6300\` ON \`check_in\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_73df8958ae4dd7dd79bd66cbc9\` ON \`check_in\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_9cfb08e0d5f8e52359f098d51d\` ON \`check_in\`
        `);
        await queryRunner.query(`
            DROP TABLE \`check_in\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_87dad2bba6d2af1326e682a8a7\` ON \`entitlement\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b768bdb5ae9f7af0c4ac3f6cbf\` ON \`entitlement\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b46a44c7b26fd018c05a4eacdf\` ON \`entitlement\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_13a1e951baa177f948e7a9adf6\` ON \`entitlement\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b90dd4440cb533c5296002cf59\` ON \`entitlement\`
        `);
        await queryRunner.query(`
            DROP TABLE \`entitlement\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_1557ce984b27aa1b2ed4e903e7\` ON \`purchase\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_ccf6154b551c1351f235c67159\` ON \`purchase\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_2248a331258d17d204ccfe9497\` ON \`purchase\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_a553d3aa02f37f28b2808efa3a\` ON \`purchase\`
        `);
        await queryRunner.query(`
            DROP TABLE \`purchase\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_99f6acc9fbe4a9b92776538996\` ON \`package_facility\`
        `);
        await queryRunner.query(`
            DROP TABLE \`package_facility\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_d7bc40d7a9962bb58fbad24e23\` ON \`package\`
        `);
        await queryRunner.query(`
            DROP TABLE \`package\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_1f0d0a085d82741259b8f88f21\` ON \`facility\`
        `);
        await queryRunner.query(`
            DROP TABLE \`facility\`
        `);
    }

}
