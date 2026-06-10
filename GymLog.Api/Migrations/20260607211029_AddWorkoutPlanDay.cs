using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymLog.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutPlanDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlanDayId",
                table: "Workouts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workouts_PlanDayId",
                table: "Workouts",
                column: "PlanDayId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workouts_PlanDays_PlanDayId",
                table: "Workouts",
                column: "PlanDayId",
                principalTable: "PlanDays",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workouts_PlanDays_PlanDayId",
                table: "Workouts");

            migrationBuilder.DropIndex(
                name: "IX_Workouts_PlanDayId",
                table: "Workouts");

            migrationBuilder.DropColumn(
                name: "PlanDayId",
                table: "Workouts");
        }
    }
}
