using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProkatHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItemSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Specifications",
                table: "Items",
                type: "jsonb",
                nullable: true);

            // Items created before specifications existed load with an empty list.
            migrationBuilder.Sql("UPDATE \"Items\" SET \"Specifications\" = '[]'::jsonb WHERE \"Specifications\" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "Items");
        }
    }
}
