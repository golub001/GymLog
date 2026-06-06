using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymLog.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMealType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MealType",
                table: "DiaryEntries",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MealType",
                table: "DiaryEntries");
        }
    }
}
