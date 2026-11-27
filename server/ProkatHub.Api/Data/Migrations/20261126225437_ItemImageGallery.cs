using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProkatHub.Api.Data.Migrations
{
    /// <summary>Items get a list of photos in place of one: the old photo becomes the first of the list.</summary>
    public partial class ItemImageGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Nullable first, so existing rows can be filled in before the column becomes required.
            migrationBuilder.AddColumn<string>(
                name: "ImageUrls",
                table: "Items",
                type: "json",
                nullable: true,
                collation: "utf8mb4_unicode_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql(
                "UPDATE `Items` SET `ImageUrls` = IF(`ImageUrl` IS NULL OR TRIM(`ImageUrl`) = '', JSON_ARRAY(), JSON_ARRAY(`ImageUrl`));");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrls",
                table: "Items",
                type: "json",
                nullable: false,
                collation: "utf8mb4_unicode_ci",
                oldClrType: typeof(string),
                oldType: "json",
                oldNullable: true,
                oldCollation: "utf8mb4_unicode_ci")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Items");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Items",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                collation: "utf8mb4_unicode_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Only the cover survives the way back.
            migrationBuilder.Sql(
                "UPDATE `Items` SET `ImageUrl` = LEFT(JSON_UNQUOTE(JSON_EXTRACT(`ImageUrls`, '$[0]')), 500);");

            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "Items");
        }
    }
}
