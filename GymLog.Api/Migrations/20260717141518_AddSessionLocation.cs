using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymLog.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "LocationLat",
                table: "ScheduledSessions",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LocationLng",
                table: "ScheduledSessions",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationName",
                table: "ScheduledSessions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocationLat",
                table: "ScheduledSessions");

            migrationBuilder.DropColumn(
                name: "LocationLng",
                table: "ScheduledSessions");

            migrationBuilder.DropColumn(
                name: "LocationName",
                table: "ScheduledSessions");
        }
    }
}
