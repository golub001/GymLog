using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymLog.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExerciseMediaAndProfileCleanup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "YoutubeUrl",
                table: "Exercises",
                newName: "ImageUrl");

            migrationBuilder.AddColumn<string>(
                name: "GifUrl",
                table: "Exercises",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GifUrl",
                table: "Exercises");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "Exercises",
                newName: "YoutubeUrl");
        }
    }
}
