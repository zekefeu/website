const fs = require("node:fs");
const moment = require("moment");
const CleanCSS = require("clean-css");
const htmlmin = require("html-minifier");
const readdirRecursive = require("fs-readdir-recursive");

module.exports = function (eleventyConfig) {
	// Static files & assets
	eleventyConfig.addPassthroughCopy({
		static: "static",
		"static/assets/root": "/",
		"static/assets/.well-known": "/.well-known",
	});

	// Create a custom collection that includes every template in the .views/posts/ folder
	eleventyConfig.addCollection("posts", function (collectionApi) {
		let templates = collectionApi.getAll();

		// Only include blog posts and ignore posts that are marked as hidden
		templates = templates.filter(
			(post) => post.inputPath.startsWith("./views/posts/") && !post.data.hidden
		);

		// Sort the posts by creation date
		templates = templates.sort((a, b) => {
			const aTime = new Date(a.data.page.date).getTime();
			const bTime = new Date(b.data.page.date).getTime();

			return -(aTime - bTime);
		});

		// Generate a pretty date based on the date property
		templates.forEach((template) => {
			template.data.prettyDate = moment(template.data.page.date).format(
				"YYYY-MM-DD"
			);
		});

		return templates;
	});

	// Minify HTML files
	eleventyConfig.addTransform("htmlmin", function (content) {
		if (this.outputPath && this.outputPath.endsWith(".html")) {
			return htmlmin.minify(content, {
				removeComments: true,
				collapseWhitespace: true,
			});
		}

		return content;
	});

	/**
	 * Minify CSS files
	 * As we're dealing with assets, we have to use the eleventy.after hook,
	 * We can't use a transform like HTML files
	 */
	eleventyConfig.on("eleventy.after", async () => {
		const CSSRoot = "_site/static/css/";

		// Loop through each stylesheet in the css folder
		// And replace it with the minified version of itself
		readdirRecursive(CSSRoot).forEach((fileName) => {
			const filePath = CSSRoot + fileName;

			const file = fs.readFileSync(filePath).toString();

			const minifiedFile = new CleanCSS({ level: 2 }).minify(file).styles;

			fs.writeFileSync(filePath, minifiedFile);
		});
	});

	// Enumerates stuff like tags
	eleventyConfig.addFilter("enumerate", function (array) {
		if (!array) return "";
		else return array.join(", ");
	});

	return {
		dir: {
			input: "views",
			output: "_site",
		},
	};
};
