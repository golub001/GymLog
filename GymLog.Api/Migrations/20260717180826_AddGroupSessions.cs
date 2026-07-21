using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GymLog.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"ScheduledSessions\";");

            migrationBuilder.DropForeignKey(
                name: "FK_ScheduledSessions_Users_InviteeId",
                table: "ScheduledSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_ScheduledSessions_Users_InviterId",
                table: "ScheduledSessions");

            migrationBuilder.DropIndex(
                name: "IX_ScheduledSessions_InviteeId",
                table: "ScheduledSessions");

            migrationBuilder.DropColumn(
                name: "InviteeId",
                table: "ScheduledSessions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ScheduledSessions");

            migrationBuilder.RenameColumn(
                name: "InviterId",
                table: "ScheduledSessions",
                newName: "HostId");

            migrationBuilder.RenameIndex(
                name: "IX_ScheduledSessions_InviterId",
                table: "ScheduledSessions",
                newName: "IX_ScheduledSessions_HostId");

            migrationBuilder.CreateTable(
                name: "SessionParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionParticipants_ScheduledSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "ScheduledSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionParticipants_SessionId_UserId",
                table: "SessionParticipants",
                columns: new[] { "SessionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionParticipants_UserId",
                table: "SessionParticipants",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledSessions_Users_HostId",
                table: "ScheduledSessions",
                column: "HostId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ScheduledSessions_Users_HostId",
                table: "ScheduledSessions");

            migrationBuilder.DropTable(
                name: "SessionParticipants");

            migrationBuilder.RenameColumn(
                name: "HostId",
                table: "ScheduledSessions",
                newName: "InviterId");

            migrationBuilder.RenameIndex(
                name: "IX_ScheduledSessions_HostId",
                table: "ScheduledSessions",
                newName: "IX_ScheduledSessions_InviterId");

            migrationBuilder.AddColumn<int>(
                name: "InviteeId",
                table: "ScheduledSessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ScheduledSessions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledSessions_InviteeId",
                table: "ScheduledSessions",
                column: "InviteeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledSessions_Users_InviteeId",
                table: "ScheduledSessions",
                column: "InviteeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledSessions_Users_InviterId",
                table: "ScheduledSessions",
                column: "InviterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
